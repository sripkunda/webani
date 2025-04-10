import { AnimationSet } from "../animations/animation-set.class";
import { RenderedCollection } from "../animations/rendered-collection.class";
import { WanimAnimation } from "../animations/wanim-animation.class";
import { WanimCollectionAnimation } from "../animations/wanim-collection-animation.class";
import { WanimPolygonAnimation } from "../animations/wanim-polygon-animation.class";
import { Colors } from "../lib/colors";
import { WanimCollection } from "../objects/wanim-collection.class";
import { Vector3 } from "../util/vectors/vector3.type";
import { WanimScene } from "./wanim-scene.class";
import { vertexShader, fragmentShader } from "../shaders/shaders"
import { Playable } from "../animations/playable.type";
import { ObjectLike } from "../objects/object-like.type";
import { WanimCamera } from "../camera/wanim-camera.class";
import { WanimLight } from "../lighting/wanim-light.class";
import { WanimPrimitiveObject } from "../objects/wanim-primitive-object.class";

export class WanimCanvas {
    canvas: HTMLCanvasElement;
    interactive: boolean;
    gl: WebGL2RenderingContext;
    backgroundColor: Vector3;
    animationQueue: WanimAnimation[];
    scene: WanimScene;
    _playing: boolean;
    _onFinishAnimation: (() => void)[];
    video: {
        recordedChunks?: BlobPart[];
        mediaRecorder?: MediaRecorder;
    };
    glProgram: WebGLProgram;
    camera!: WanimCamera;
    light: WanimLight

    constructor(canvas: HTMLCanvasElement, interactive: boolean = true, backgroundColor: Vector3 = Colors.BLACK) {
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
        this.camera = new WanimCamera();
        this.light = new WanimLight()
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
            if (animation instanceof WanimPrimitiveObject || animation instanceof WanimCollection) {
                this._addToScene(animation);
            } else if (animation instanceof WanimPolygonAnimation || animation instanceof WanimCollectionAnimation || animation instanceof AnimationSet) {
                this.addAnimation(animation);
            } else if (animation instanceof RenderedCollection) {
                if (animation.animated) {
                    this.addAnimation(animation.animations);
                } else {
                    this._addToScene(animation);
                }
            }
        }
    }

    addAnimation(animation: WanimAnimation): void {
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

    animate(animation: WanimAnimation, playNext: boolean = true): void {
        let t = 0;
        const startTime = Date.now();
        let prevTime = startTime;
        let objectIndex: number;

        const drawFrame = () => {
            const frame = animation.frame(t);
            if (frame instanceof WanimCamera) { 
                this.camera = frame;
            } else {
                if (!objectIndex) { 
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

    _draw(object: WanimPrimitiveObject): void {
        const vertices = object.triangles;
        const transformedVertices = this.camera.transformPointArray(vertices, this.canvas.width, this.canvas.height);
        console.log(vertices);
    
        // Step 3: Create and bind the vertex buffer
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    
        // Step 4: Set up the position attribute (location of vertex positions in the shader)
        const position = this.gl.getAttribLocation(this.glProgram, 'position');
        this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);
    
        // Step 5: Set up the material properties as uniforms
        const colorLoc = this.gl.getUniformLocation(this.glProgram, "color");
        this.gl.uniform4fv(colorLoc, [...object.material.ambient]);  // Ambient material color
    
        const lightPositionLoc = this.gl.getUniformLocation(this.glProgram, "uLightPosition");
        const lightColorLoc = this.gl.getUniformLocation(this.glProgram, "uLightColor");
        const lightIntensityLoc = this.gl.getUniformLocation(this.glProgram, "uLightIntensity");
    
        this.gl.uniform3fv(lightPositionLoc, this.light.position);
        this.gl.uniform3fv(lightColorLoc, this.light.color);    
        this.gl.uniform1f(lightIntensityLoc, this.light.intensity);              
    
        const viewPositionLoc = this.gl.getUniformLocation(this.glProgram, "uViewPosition");
        this.gl.uniform3fv(viewPositionLoc, [0.0, 0.0, 5.0]);  
    
        const materialDiffuseLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialDiffuse");
        this.gl.uniform3fv(materialDiffuseLoc, object.material.diffuse);
    
        const materialSpecularLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialSpecular");
        this.gl.uniform3fv(materialSpecularLoc, object.material.specular);
    
        const materialShininessLoc = this.gl.getUniformLocation(this.glProgram, "uMaterialShininess");
        this.gl.uniform1f(materialShininessLoc, object.material.shininess);
    
        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.normals), this.gl.STATIC_DRAW);
    
        const normalLocation = this.gl.getAttribLocation(this.glProgram, 'normal');
        this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(normalLocation);
    
        const n = vertices.length / 3;
        this.gl.drawArrays(this.gl.TRIANGLES, 0, n);
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

    _addToScene(object: ObjectLike): void {
        this.scene.add(object);
        this.redraw();
        this._finishedAnimation();
    }

    _finishedAnimation(): void {
        this._onFinishAnimation.forEach(callback => callback());
    }
}
