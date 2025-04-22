import { WebaniAnimation } from "./animation/webani-animation.class";
import { Colors } from "./lighting/colors";
import { Vector3 } from "../types/vector3.type";
import { WebaniScene } from "./scene/webani-scene.class";
import { brdfLUTComputeShaderSet, irradianceComputeShaderSet, objectShaderSet, prefilterComputeShaderSet, skyboxShaderSet } from "./lighting/shaders/shaders"
import { Playable } from "../types/playable.type";
import { RenderableObject } from "../types/renderable-object.type";
import { WebaniPointLight } from "./lighting/webani-point-light.class";
import { WebaniPrimitiveObject } from "./scene/webani-primitive-object.class";
import { ShaderSet } from "../types/shader-set.type";
import { WebaniSkybox } from "./webani-skybox.class";
import { CanvasAnimationState } from "../types/canvas-animation-state.type";
import { CanvasUpdateLoop } from "../types/canvas-update-loop.type";
import { WebaniPerspectiveCamera } from "./scene/webani-perspective-camera.class";

export type WebaniRendererOptions = {
    canvas: HTMLCanvasElement,
    backgroundColor?: Vector3,
    antialias?: boolean,
};

export class WebaniCanvas {
    htmlCanvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    backgroundColor: Vector3;
    
    private animationQueue: WebaniAnimation[];
    private updateLoops: CanvasUpdateLoop[];
    private animationFinishedHandlers: (() => void)[];
    private animationQueueFinishedHandlers: (() => void)[];
    private started = false;
    
    private video: {
        recordedChunks?: BlobPart[];
        mediaRecorder?: MediaRecorder;
    };

    private scene!: WebaniScene;
    private camera!: WebaniPerspectiveCamera;
    private light!: WebaniPointLight;
    private paused = false;
    
    skybox?: WebaniSkybox;
    
    private shaderPrograms: Record<string, WebGLProgram> = {};
    private attributeLocations: object = {};
    private attributeBuffers: object = {};
    
    static defaultCanvas?: WebaniCanvas;

    constructor({
        canvas, 
        backgroundColor = Colors.BLACK,
        antialias = true,
    }: WebaniRendererOptions) {
        if (!canvas)
            throw Error("A canvas object must be provided to create a Webani canvas element.");

        this.htmlCanvas = canvas;
        this.gl = canvas.getContext("webgl2", { antialias });
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.backgroundColor = backgroundColor;
        this.animationQueue = [];
        this.video = {};

        this.animationFinishedHandlers = []; 
        this.animationQueueFinishedHandlers = [];
        this.updateLoops = [];

        if (!this.gl)
            throw Error("WebGL could not be initialized for Webani canvas.");

        this.createShaders({
            object: objectShaderSet,
            skybox: skyboxShaderSet,
            irradianceCompute: irradianceComputeShaderSet,
            prefilterCompute: prefilterComputeShaderSet,
            brdfLUTCompute: brdfLUTComputeShaderSet
        });

        if (!WebaniCanvas.defaultCanvas) { 
            WebaniCanvas.defaultCanvas = this;
        }
    }

    getShaderVariableLocation(name: string) { 
        return this.attributeLocations[name];
    }

    setSkybox(images: ImageBitmap[]) {
        this.pause();
        this.skybox = new WebaniSkybox(this, images);
        this.resume();
    }

    startRecording(): void {
        this.video.recordedChunks = [];
        const stream = this.htmlCanvas.captureStream(60);
        this.video.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp9',
            bitsPerSecond: 510000
        });
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
            if (this.animationQueue.length == 0) { 
                resolve();
            }
            this.onFinishAnimationQueue(resolve);
        });
    }

    redraw(): void {
        this.glClear();
        this.drawSkybox();
        this.drawObjects();
    }

    glClear(): void {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthMask(true);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.clearDepth(1.0);
        this.gl.viewport(0, 0, this.htmlCanvas.width, this.htmlCanvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }


    clear(): void {
        this.scene.clear();
        this.glClear();
    }

    remove(object: RenderableObject): void {
        this.scene.remove(object);
    }

    pause() { 
        this.paused = true;
    }

    resume() { 
        this.paused = false;
    }

    play(...animations: Playable[]): void {
        for (const animation of animations) {
            if (animation instanceof WebaniAnimation) {
                this.addAnimation(animation);
            } else {
                this.addToScene(animation);
            }    
        }
        this.start();
    }

    onUpdate(handler: CanvasUpdateLoop): void {
        this.updateLoops.push(handler);
        this.start();
    }

    onFinishAnimationQueue(handler: () => void): void {
        this.animationQueueFinishedHandlers.push(handler);
    }

    onFinishAnimation(handler: () => void): void {
        this.animationFinishedHandlers.push(handler);
    }

    private async start() { 
        if (this.started) return;
        this.started = true;

        await this.initializeScene();

        const animationState: CanvasAnimationState = {
            animationTime: 0,
        };
        let prevTime = Date.now();

        const loop = () => {
            if (this.skybox !== undefined && !this.paused) { 
                const deltaTime = Date.now() - prevTime;
                for (let updateLoop of this.updateLoops) { 
                    updateLoop(deltaTime);
                }
                this.defaultUpdateLoop(deltaTime, animationState);
                prevTime = Date.now();
                this.redraw();
            }
            requestAnimationFrame(loop);
        };
        this.gl.finish();
        requestAnimationFrame(loop);
    }

    private addAnimation(animation: WebaniAnimation): void {
        this.animationQueue.unshift(animation);
    }

    private defaultUpdateLoop(deltaTime: number, animationState: CanvasAnimationState) {
        if (this.animationQueue.length < 1) { 
            return;
        }
        animationState.animationTime += deltaTime;
        const animation = this.animationQueue[this.animationQueue.length - 1];
        const frame = animation.frame(animationState.animationTime);
        if (frame instanceof WebaniPerspectiveCamera) { 
            this.camera = frame;
        } else {
            if (animationState.objectIndex === undefined) { 
                animationState.objectIndex = this.scene.add(frame as RenderableObject);
            }
            this.scene._members[animationState.objectIndex] = frame as RenderableObject;
        }
        if (animation.done(animationState.animationTime)) { 
            this.animationQueue.pop();
            animationState.animationTime = 0;
            this.finishedAnimation();
            if (this.animationQueue.length > 0) { 
                this.finishedAnimationQueue();
            }
        }
    }

    private async initializeScene() {
        this.scene = new WebaniScene();
        this.camera = new WebaniPerspectiveCamera();
        this.light = new WebaniPointLight();
        const z = this.htmlCanvas.width / (2 * Math.tan(this.camera.fov));
        this.camera.far = 10000 + z;
        this.camera.transform.position[2] = z;
        this.skybox ??= await WebaniSkybox.fallback(this);
    }

    private drawSkybox() {
        this.changeShaderProgram("skybox");

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox.cubeMapTexture);

        this.gl.depthMask(false);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uProjectionMatrix"), true, this.camera.projectionMatrix(this.htmlCanvas.width, this.htmlCanvas.height));
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uViewMatrix"), true, this.camera.viewMatrix);

        this.gl.uniform1i(this.getShaderVariableLocation("uHDRTexture"), 0);

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
        const triangles = object.triangles;
        this.bindAttributeBuffer("position", triangles, 3);
        this.bindAttributeBuffer("normal", object.normals, 3);
        
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uProjectionMatrix"), true, this.camera.projectionMatrix(this.htmlCanvas.width, this.htmlCanvas.height));
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uViewMatrix"), true, this.camera.viewMatrix);
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uModelMatrix"), true, object.modelMatrix);
        this.gl.uniform3fv(this.getShaderVariableLocation("uCameraPosition"), this.camera.transform.position);
        
        this.gl.uniform3fv(this.getShaderVariableLocation("uLightPosition"), this.light.transform.position);
        this.gl.uniform3fv(this.getShaderVariableLocation("uLightColor"), this.light.color);
        this.gl.uniform1f(this.getShaderVariableLocation("uLightIntensity"), this.light.intensity);
        
        this.gl.uniform1f(this.getShaderVariableLocation("uMaterialMetallic"), object.material.metallic);
        this.gl.uniform3fv(this.getShaderVariableLocation("uMaterialColor"), object.material.color);
        this.gl.uniform1f(this.getShaderVariableLocation("uMaterialRoughness"), object.material.roughness);
        this.gl.uniform1f(this.getShaderVariableLocation("uMaterialOpacity"), object.material.opacity);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox.irradianceTexture);
        this.gl.uniform1i(this.getShaderVariableLocation("uIrradianceMap"), 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox.prefilteredTexture);
        this.gl.uniform1i(this.getShaderVariableLocation("uPrefilteredEnvMap"), 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, WebaniSkybox.brdfLUTTexture);
        this.gl.uniform1i(this.getShaderVariableLocation("uBrdfLUT"), 2);

        const n = triangles.length / 3;
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
        for (let key in this.attributeLocations) {
            const loc = this.attributeLocations[key];
            if (typeof loc === "number") {
                this.gl.deleteBuffer(this.attributeBuffers[key]);
                this.gl.disableVertexAttribArray(loc);
            }
        }
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
        this.finishedAnimation();
    }

    private finishedAnimation(): void {
        this.animationFinishedHandlers.forEach(callback => callback());
    }

    private finishedAnimationQueue(): void {
        this.animationQueueFinishedHandlers.forEach(callback => callback());
    }
}
