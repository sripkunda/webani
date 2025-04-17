import { WebaniAnimation } from "../animations/webani-animation.class";
import { Colors } from "../lighting/colors";
import { Vector3 } from "../types/vector3.type";
import { WebaniScene } from "./webani-scene.class";
import { irradianceComputeShaderSet, objectShaderSet, prefilterComputeShaderSet, skyboxShaderSet } from "../lighting/shaders/shaders"
import { Playable } from "../types/playable.type";
import { RenderableObject } from "../types/renderable-object.type";
import { WebaniPerspectiveCamera } from "../camera/webani-perspective-camera.class";
import { WebaniLight } from "../lighting/webani-light.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";
import { ShaderSet } from "../types/shader-set.type";
import { WebaniSkybox } from "./webani-skybox.class";

export class WebaniCanvas {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    backgroundColor: Vector3;
    
    private animationQueue: WebaniAnimation[];
    private scene!: WebaniScene;
    private playing: boolean;
    private animationFinishedHandlers: (() => void)[];
    
    video: {
        recordedChunks?: BlobPart[];
        mediaRecorder?: MediaRecorder;
    };

    camera!: WebaniPerspectiveCamera;
    light!: WebaniLight;
    skybox?: WebaniSkybox;

    shaderPrograms: Record<string, WebGLProgram> = {};
    attributeLocations: object = {};
    attributeBuffers: object = {};
    
    static defaultCanvas?: WebaniCanvas;

    constructor(canvas: HTMLCanvasElement, backgroundColor: Vector3 = Colors.BLACK, shaders: Record<string, ShaderSet> = {}) {
        if (!canvas)
            throw Error("A canvas object must be provided to create a Webani canvas element.");

        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2", { antialias: true });
        this.backgroundColor = backgroundColor;
        this.animationQueue = [];
        this.video = {};
        this.playing = false;
        this.animationFinishedHandlers = []; 
        if (!this.gl)
            throw Error("WebGL could not be initialized for Webani canvas.");

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.initializeScene();
        this.glClear();
        this.createShaders({
            object: objectShaderSet,
            skybox: skyboxShaderSet,
            irradianceCompute: irradianceComputeShaderSet,
            prefilterCompute: prefilterComputeShaderSet,
        });
        this.createShaders(shaders);

        if (!WebaniCanvas.defaultCanvas) { 
            WebaniCanvas.defaultCanvas = this;
        }
    }

    setSkybox(hdrImage: ImageBitmap) { 
        this.skybox = new WebaniSkybox(hdrImage, this);
        this.redraw();
    }

    startRecording(): void {
        this.video.recordedChunks = [];
        const stream = this.canvas.captureStream(30);
        this.video.mediaRecorder = new MediaRecorder(stream);
        this.video.mediaRecorder.ondataavailable = (event) => {
            this.video.recordedChunks!.push(event.data);
        };
        this.video.mediaRecorder.start();
    }

    async stopRecording(): Promise<void> {
        await this.finishPlaying();
        this.video.mediaRecorder!.stop();
        this.video.mediaRecorder!.onstop = () => {
            const blob = new Blob(this.video.recordedChunks, { type: 'video/webm' });
            const videoURL = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = videoURL;
            downloadLink.download = 'webani_output.webm';
            downloadLink.click();
        };
    }

    finishPlaying(): Promise<void> {
        return new Promise(resolve => {
            if (!this.playing) {
                resolve();
            }
            this.onFinishAnimation(resolve);
        });
    }

    redraw(): void {
        this.glClear();
        this.drawSkybox();
        // this.drawObjects();
    }

    glClear(): void {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }


    clear(): void {
        this.scene.clear();
        this.glClear();
    }

    remove(object: RenderableObject): void {
        this.scene.remove(object);
    }

    play(...animations: Playable[]): void {
        for (const animation of animations) {
            if (animation instanceof WebaniAnimation) {
                this.addAnimation(animation);
            } else {
                this.addToScene(animation);
            } 
        }
    }

    private addAnimation(animation: WebaniAnimation): void {
        this.animationQueue.unshift(animation);
        if (!this.playing)
            this.playAnimationQueue();
    }

    private playAnimationQueue(): void {
        const animation = this.animationQueue.pop();
        if (!animation) return;
        this.playing = true;
        this.animate(animation);
    }

    private animate(animation: WebaniAnimation, playNext: boolean = true): void {
        let t = 0;
        const startTime = Date.now();
        let prevTime = startTime;
        let objectIndex: number;

        const drawFrame = () => {
            const frame = animation.frame(t);
            if (frame instanceof WebaniPerspectiveCamera) { 
                this.camera = frame;
            } else {
                if (objectIndex === undefined) { 
                    objectIndex = this.scene.add(frame as RenderableObject);
                }
                this.scene._members[objectIndex] = frame as RenderableObject;
            }
            this.redraw();
            if (!animation.done(t)) {
                t += Date.now() - prevTime;
                prevTime = Date.now();
                requestAnimationFrame(drawFrame);
            } else {
                t = 0;
                if (playNext) {
                    this.playAnimationQueue();
                }
                this.finishedAnimation();
            }
        };
        requestAnimationFrame(drawFrame);
    }

    private onFinishAnimation(handler: () => void): void {
        this.animationFinishedHandlers.push(handler);
    }

    private initializeScene() {
        this.scene = new WebaniScene();
        this.camera = new WebaniPerspectiveCamera();
        this.light = new WebaniLight();
        const z = this.canvas.width / (2 * Math.tan(this.camera.fov));
        this.camera.far = 1000 + z;
        this.camera.transform.position[2] = z;
        this.light.transform.position[2] = z;
    }

    private drawSkybox() {
        if (!this.skybox) { 
            return;
        }
        this.changeShaderProgram("skybox");

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox.prefilteredTexture);

        this.gl.depthMask(false);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.uniformMatrix4fv(this.attributeLocations["uProjectionMatrix"], true, this.camera.projectionMatrix(this.canvas.width, this.canvas.height));
        this.gl.uniformMatrix4fv(this.attributeLocations["uViewMatrix"], true, this.camera.viewMatrix);

        this.gl.uniform1i(this.attributeLocations["uHDRTexture"], 0);

        this.bindAttributeBuffer("position", this.skybox.cubeVertices, 3);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.skybox.cubeVertices.length / 3);
        this.gl.depthMask(true);
        this.gl.depthFunc(this.gl.LESS);
    }

    private drawObjects() { 
        this.changeShaderProgram("object");
        for (const object of this.scene.objects) {
            this.drawObject(object);
        }
    }

    private drawObject(object: WebaniPrimitiveObject) {
        const vertices = object.triangles;

        this.bindAttributeBuffer("position", new Float32Array(vertices.flat()), 3);
        this.bindAttributeBuffer("normal", new Float32Array(object.normals.flat()), 3);
    
        this.gl.uniformMatrix4fv(this.attributeLocations["projectionMatrix"], true, this.camera.projectionMatrix(this.canvas.width, this.canvas.height));
        this.gl.uniformMatrix4fv(this.attributeLocations["viewMatrix"], true, this.camera.viewMatrix);
        this.gl.uniformMatrix4fv(this.attributeLocations["modelMatrix"], true, object.modelMatrix);
        
        this.gl.uniform3fv(this.attributeLocations["uLightPosition"], this.light.transform.position);
        this.gl.uniform3fv(this.attributeLocations["uLightColor"], this.light.color);
        this.gl.uniform1f(this.attributeLocations["uLightIntensity"], this.light.intensity);
        
        this.gl.uniform3fv(this.attributeLocations["uViewPosition"], this.camera.transform.position);
        
        this.gl.uniform3fv(this.attributeLocations["uMaterialDiffuse"], object.material.diffuse);
        this.gl.uniform3fv(this.attributeLocations["uMaterialSpecular"], object.material.specular);
        this.gl.uniform3fv(this.attributeLocations["uMaterialAmbient"], object.material.ambient);
        this.gl.uniform3fv(this.attributeLocations["uMaterialColor"], object.material.color);
        this.gl.uniform1f(this.attributeLocations["uMaterialShininess"], object.material.shininess);
        this.gl.uniform1f(this.attributeLocations["uMaterialOpacity"], object.material.opacity);
    
        const n = vertices.length;
        this.gl.drawArrays(this.gl.TRIANGLES, 0, n);
    }

    private createShaders(shaders: Record<string, ShaderSet>): void {
        const compileShaders = (glsl: string, type: number): WebGLShader => {
            const shader = this.gl.createShader(type);
            if (!shader) throw Error("An unknown error occurred while creating shader. Please report a bug.");
            this.gl.shaderSource(shader, glsl);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw Error(`A GLSL occurred while compiling shaders: ${this.gl.getShaderInfoLog(shader)}`);
            }
            return shader;
        };

        const linkShaders = (vertex: WebGLShader, fragment: WebGLShader): WebGLProgram => {
            const program = this.gl.createProgram();
            if (!program) throw Error("An unknown error occurred while creating program. Please report a bug.");
            this.gl.attachShader(program, vertex);
            this.gl.attachShader(program, fragment);
            this.gl.linkProgram(program);
            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                throw Error(`A GLSL occurred while linking shaders: ${this.gl.getProgramInfoLog(program)}`);
            }
            return program;
        };

        const createShaderProgram = (vertex: string, fragment: string): WebGLProgram => {
            const vertexShader = compileShaders(vertex, this.gl.VERTEX_SHADER);
            const fragmentShader = compileShaders(fragment, this.gl.FRAGMENT_SHADER);
            const program = linkShaders(vertexShader, fragmentShader);
            return program;
        }

        for (const shaderName in shaders) {
            const shader = shaders[shaderName];
            const program = createShaderProgram(shader.vertex, shader.fragment);
            this.shaderPrograms[shaderName] = program;
        }
    }

    bindAttributeBuffer(attribName: string, data: Float32Array, size: number): void {
        const buffer = this.attributeBuffers[attribName];
        const loc = this.attributeLocations[attribName];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(loc, size, this.gl.FLOAT, false, 0, 0);
    }

    changeShaderProgram(name: string) { 
        this.gl.useProgram(this.shaderPrograms[name]);
        const program = this.shaderPrograms[name];
        this.attributeLocations = {};
        this.attributeBuffers = {};
        const numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = this.gl.getActiveUniform(program, i);
            if (!info) continue;
            this.attributeLocations[info.name] = this.gl.getUniformLocation(program, info.name);
        }
    
        const numAttributes = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const info = this.gl.getActiveAttrib(program, i);
            if (!info) continue;
            const loc = this.gl.getAttribLocation(program, info.name);
            this.attributeLocations[info.name] = loc;
            this.gl.enableVertexAttribArray(loc);
            this.attributeBuffers[info.name] = this.gl.createBuffer();
        }
    }

    private addToScene(object: RenderableObject): void {
        this.scene.add(object);
        this.redraw();
        this.finishedAnimation();
    }

    private finishedAnimation(): void {
        this.animationFinishedHandlers.forEach(callback => callback());
    }
}
