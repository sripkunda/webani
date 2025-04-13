import { RenderedCollection } from "../animations/rendered-collection.class";
import { LorentzAnimation } from "../animations/lorentz-animation.class";
import { Colors } from "../api/colors";
import { Vector3 } from "../util/vectors/vector3.type";
import { LorentzScene } from "./lorentz-scene.class";
import { vertexShader, fragmentShader } from "../shaders/shaders"
import { Playable } from "../animations/playable.type";
import { ObjectLike } from "../objects/object-like.type";
import { LorentzCamera } from "../camera/lorentz-camera.class";
import { LorentzLight } from "../lighting/lorentz-light.class";
import { LorentzPrimitiveObject } from "../objects/lorentz-primitive-object.class";

export class LorentzCanvas {
    canvas: HTMLCanvasElement;
    interactive: boolean;
    gl: WebGL2RenderingContext;
    backgroundColor: Vector3;
    animationQueue: LorentzAnimation[];
    scene: LorentzScene;
    _playing: boolean;
    _onFinishAnimation: (() => void)[];
    video: {
        recordedChunks?: BlobPart[];
        mediaRecorder?: MediaRecorder;
    };
    glProgram: WebGLProgram;
    camera!: LorentzCamera;
    light: LorentzLight

    constructor(canvas: HTMLCanvasElement, interactive: boolean = true, backgroundColor: Vector3 = Colors.BLACK) {
        if (!canvas)
            throw Error("A canvas object must be provided to create a Lorentz canvas element.");

        this.canvas = canvas;
        this.interactive = interactive;
        this.gl = canvas.getContext("webgl2", { antialias: true })!;
        this.backgroundColor = backgroundColor;
        this.animationQueue = [];

        if (!this.gl)
            throw Error("WebGL could not be initialized for Lorentz canvas.");

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.scene = new LorentzScene();
        this._clear();
        this._initShaders();
        this._playing = false;
        this._onFinishAnimation = [];
        this.video = {};
        this.camera = new LorentzCamera();
        this.light = new LorentzLight();
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
            downloadLink.download = 'lorentz_output.webm';
            downloadLink.click();
        };
    }

    finishPlaying(): Promise<void> {
        return new Promise(resolve => {
            if (!this._playing) {
                resolve();
            }
            this.onFinishAnimation(resolve);
        });
    }

    redraw(): void {
        this._clear();
        for (const object of this.scene.objects) {
            this._draw(object);
        }
    }

    clear(): void {
        this.scene.clear();
        this._clear();
    }

    onFinishAnimation(handler: () => void): void {
        this._onFinishAnimation.push(handler);
    }

    play(...animations: Playable[]): void {
        for (const animation of animations) {
            if (animation instanceof LorentzAnimation) {
                this.addAnimation(animation);
            } else {
                this._addToScene(animation);
            } 
        }
    }

    addAnimation(animation: LorentzAnimation): void {
        this.animationQueue.unshift(animation);
        if (!this._playing)
            this.playAnimationQueue();
    }

    playAnimationQueue(): void {
        const animation = this.animationQueue.pop();
        if (!animation) return;
        this._playing = true;
        this.animate(animation);
    }

    animate(animation: LorentzAnimation, playNext: boolean = true): void {
        let t = 0;
        const startTime = Date.now();
        let prevTime = startTime;
        let objectIndex: number;

        const drawFrame = () => {
            const frame = animation.frame(t);
            if (frame instanceof LorentzCamera) { 
                this.camera = frame;
            } else {
                if (objectIndex === undefined) { 
                    objectIndex = this.scene.add(frame as ObjectLike);
                }
                this.scene._members[objectIndex] = frame as ObjectLike;
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
                this._finishedAnimation();
            }
        };
        requestAnimationFrame(drawFrame);
    }

    remove(object: ObjectLike): void {
        this.scene.remove(object);
    }

    _clear(): void {
        this.gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    _draw(object: LorentzPrimitiveObject) {
        const vertices = object.triangles;
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), this.gl.STATIC_DRAW);
    
        const position = this.gl.getAttribLocation(this.glProgram, 'position');
        this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);

        const projectionMatrixLoc = this.gl.getUniformLocation(this.glProgram, 'projectionMatrix');
        this.gl.uniformMatrix4fv(projectionMatrixLoc, true, this.camera.projectionMatrix(this.canvas.width, this.canvas.height));

        const viewMatrixLoc = this.gl.getUniformLocation(this.glProgram, 'viewMatrix');
        this.gl.uniformMatrix4fv(viewMatrixLoc, true, this.camera.viewMatrix);

        const modelMatrixLoc = this.gl.getUniformLocation(this.glProgram, 'modelMatrix');
        this.gl.uniformMatrix4fv(modelMatrixLoc, true, object.modelMatrix);
    
        const lightPositionLoc = this.gl.getUniformLocation(this.glProgram, "uLightPosition");
        const lightColorLoc = this.gl.getUniformLocation(this.glProgram, "uLightColor");
        const lightIntensityLoc = this.gl.getUniformLocation(this.glProgram, "uLightIntensity");

        this.gl.uniform3fv(lightPositionLoc, this.light.position);
        this.gl.uniform3fv(lightColorLoc, this.light.color);    
        this.gl.uniform1f(lightIntensityLoc, this.light.intensity);              
    
        const viewPositionLoc = this.gl.getUniformLocation(this.glProgram, "uViewPosition");
        this.gl.uniform3fv(viewPositionLoc, this.camera.position);  
    
        const materialDiffuseLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialDiffuse");
        this.gl.uniform3fv(materialDiffuseLoc, object.material.diffuse);
    
        const materialSpecularLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialSpecular");
        this.gl.uniform3fv(materialSpecularLoc, object.material.specular);

        const materialAmbientLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialAmbient");
        this.gl.uniform3fv(materialAmbientLoc, object.material.ambient);
    
        const materialColorLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialColor");
        this.gl.uniform3fv(materialColorLoc, object.material.color);

        const materialShininessLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialShininess");
        this.gl.uniform1f(materialShininessLoc, object.material.shininess);

        const materialOpacityLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialOpacity");
        this.gl.uniform1f(materialOpacityLoc, object.material.opacity);
    
        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.normals.flat()), this.gl.STATIC_DRAW);
    
        const normalLocation = this.gl.getAttribLocation(this.glProgram, 'normal');
        this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(normalLocation);
    
        const n = vertices.length;
        this.gl.drawArrays(this.gl.TRIANGLES, 0, n);
    }

    _initShaders(): void {
        const makeShader = (glsl: string, type: number): WebGLShader => {
            const shader = this.gl.createShader(type);
            if (!shader) throw Error("An unknown error occurred while creating shader. Please report a bug.");
            this.gl.shaderSource(shader, glsl);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw Error(`A GLSL occurred while compiling shaders: ${this.gl.getShaderInfoLog(shader)}`);
            }
            return shader;
        };

        const vertex = makeShader(vertexShader, this.gl.VERTEX_SHADER);
        const fragment = makeShader(fragmentShader, this.gl.FRAGMENT_SHADER);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertex);
        this.gl.attachShader(program, fragment);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const log = this.gl.getProgramInfoLog(program);
            console.error("Program linking error:\n", log);
            this.gl.deleteShader(vertex);
            this.gl.deleteShader(fragment);
            this.gl.deleteProgram(program);
            throw Error("Unable to initialize the shader program");
        }

        this.gl.useProgram(program);
        this.glProgram = program;
    }

    _addToScene(object: ObjectLike): void {
        this.scene.add(object);
        this.redraw();
        this._finishedAnimation();
    }

    _finishedAnimation(): void {
        this._onFinishAnimation.forEach(callback => callback());
    }
}
