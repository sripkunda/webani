import { AnimationSet } from "../animations/animation-set.class";
import { RenderedCollection } from "../animations/rendered-collection.class";
import { WanimAnimationBase } from "../animations/wanim-animation-base.class";
import { WanimCollectionAnimation } from "../animations/wanim-collection-animation.class";
import { WanimObjectAnimation } from "../animations/wanim-object-animation.class";
import { Colors } from "../lib/colors";
import { WanimCollection } from "../objects/wanim-collection.class";
import { WanimObject } from "../objects/wanim-object.class";
import { Vector } from "../util/vector.type";
import { WanimScene } from "./wanim-scene.class";
import { vertexShader, fragmentShader } from "../shaders/shaders"

export class WanimCanvas {
    canvas: HTMLCanvasElement;
    interactive: boolean;
    gl: WebGL2RenderingContext;
    backgroundColor: Vector;
    animationQueue: WanimAnimationBase[];
    scene: WanimScene;
    _playing: boolean;
    _onFinishAnimation: (() => void)[];
    video: {
        recordedChunks?: BlobPart[];
        mediaRecorder?: MediaRecorder;
    };
    glProgram: WebGLProgram;

    constructor(canvas: HTMLCanvasElement, interactive: boolean = true, backgroundColor: number[] = Colors.BLACK) {
        if (!canvas)
            throw Error("A canvas object must be provided to create a Wanim canvas element.");

        this.canvas = canvas;
        this.interactive = interactive;
        this.gl = canvas.getContext("webgl2", { antialias: true })!;
        this.backgroundColor = backgroundColor;
        this.animationQueue = [];

        if (!this.gl)
            throw Error("WebGL could not be initialized for Wanim canvas.");

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.scene = new WanimScene();
        this._clear();
        this._initShaders();
        this._playing = false;
        this._onFinishAnimation = [];
        this.video = {};
    }

    startRecording(): void {
        this.video.recordedChunks = [];
        let stream = this.canvas.captureStream(30);
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
            downloadLink.download = 'wanim_output.webm';
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
        for (let object of this.scene.objects) {
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

    play(...animations: any[]): void {
        for (let animation of animations) {
            if (animation instanceof WanimObject || animation instanceof WanimCollection) {
                this._addToScene(animation);
            } else if (animation instanceof WanimObjectAnimation || animation instanceof WanimCollectionAnimation || animation instanceof AnimationSet) {
                this.addAnimation(animation);
            } else if (animation instanceof RenderedCollection) {
                if (animation.animated) {
                    this.addAnimation(animation._animations);
                } else {
                    this._addToScene(animation.collection);
                }
            }
        }
    }

    addAnimation(animation: any): void {
        this.animationQueue.unshift(animation);
        if (!this._playing)
            this.playAnimationQueue();
    }

    playAnimationQueue(): void {
        let animation = this.animationQueue.pop();
        if (!animation) return;
        this._playing = true;
        this.animate(animation, true);
    }

    animate(animation: any, playNext: boolean = true): void {
        let t = 0;
        let startTime = Date.now();
        let prevTime = startTime;
        let objectIndex: number;

        const drawFrame = () => {
            this.scene._members[objectIndex] = animation.frame(t);
            this.redraw();
            if (!animation.done(t)) {
                t += Date.now() - prevTime;
                prevTime = Date.now();
                requestAnimationFrame(drawFrame);
            } else {
                t = 0;
                if (playNext) {
                    animation = this.animationQueue.pop();
                    if (animation) {
                        objectIndex = this.scene.add(animation.frame(0));
                        requestAnimationFrame(drawFrame);
                        return;
                    } else {
                        this._playing = false;
                        this._finishedAnimation();
                    }
                }
            }
        };
        objectIndex = this.scene.add(animation.frame(0));
        requestAnimationFrame(drawFrame);
    }

    remove(object: any): void {
        this.scene.remove(object);
    }

    _clear(): void {
        this.gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    _draw(object: any): void {
        if (!object) return;
        let vertices = object._dots(this.canvas.width, this.canvas.height);
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const position = this.gl.getAttribLocation(this.glProgram, 'position');
        this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);

        const colorLoc = this.gl.getUniformLocation(this.glProgram, "color");
        this.gl.uniform4fv(colorLoc, [...object.color, object.opacity]);

        const n = vertices.length / 3;
        this.gl.drawArrays(this.gl.POINTS, 0, n);
    }

    _initShaders(): void {
        const makeShader = (glsl: string, type: number): WebGLShader => {
            const shader = this.gl.createShader(type);
            if (!shader) throw Error("An unknown error occurred while creating shader");
            this.gl.shaderSource(shader, glsl);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw Error(`Error compiling shader: ${this.gl.getShaderInfoLog(shader)}`);
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
            throw Error("Unable to initialize the shader program");
        }

        this.gl.useProgram(program);
        this.glProgram = program;
    }

    _addToScene(object: any): void {
        this.scene.add(object);
        this.redraw();
        this._finishedAnimation();
    }

    _finishedAnimation(): void {
        this._onFinishAnimation.forEach(callback => callback());
    }
}
