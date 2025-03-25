import { Colors } from './constants';
import { fragmentShader, vertexShader } from './shaders'
import { WanimObject, WanimCollection } from './objects';
import { AnimationSet, RenderedCollection, WanimCollectionAnimation, WanimObjectAnimation } from './animations';

export var _defaultCanvas;
export const setDefaultCanvas = (canvas) => {
    _defaultCanvas = canvas;
};

export const loadCanvas = async function (...canvases) {
    const c = canvases.map(canvas => new WanimCanvas(canvas));
    if (c.length > 0) { 
        setDefaultCanvas(await c[0]);
    }
    return c.length > 1 ? c : c[0];
}

export const FPSDisplay = class {
    constructor(element) {
        this.element = element;
        this.init();
    }

    init() {
        let prevTime = 0;
        const render = (currentTime) => {
            currentTime /= 1000;
            const fps = 1 / (currentTime - prevTime);
            prevTime = currentTime;
            this.element.textContent = fps.toFixed(1);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
};

export const WanimCanvas = class {
    constructor(canvas, interactive = true, backgroundColor = Colors.BLACK) {
        if (!canvas)
            throw Error(
                "A canvas object must be provided to create a Wanim canvas element."
            );
        this.canvas = canvas;
        this.interactive = interactive;
        this.gl = canvas.getContext("webgl2", {
            antialias: true
        });
        this.backgroundColor = backgroundColor;
        this.animationQueue = [];
        // If there is no WebGL, say that there is no WebGL
        if (!this.gl)
            throw Error("WebGL could not be initialized for Wanim canvas.");
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.scene = new WanimScene();
        this._clear();
        this._initShaders();
        this._playing = false;
        this._onFinishAnimation = []
        this.video = {}
        return new Promise(resolve => {
            if (document.readyState === "loading") {
                // If the document is still loading, wait for the 'DOMContentLoaded' event
                document.addEventListener("DOMContentLoaded", () => resolve(this));
            } else {
                // Document is already ready, resolve immediately
                resolve(this);
            }
        });
    }

    startRecording() {
        this.video.recordedChunks = [];
        let stream = this.canvas.captureStream(30);
        this.video.mediaRecorder = new MediaRecorder(stream);
        this.video.mediaRecorder.ondataavailable = (event) => {
            this.video.recordedChunks.push(event.data);
        };
        this.video.mediaRecorder.start();
    }
    

    async stopRecording() {
        await this.finishPlaying();
        this.video.mediaRecorder.stop();
        this.video.mediaRecorder.onstop = () => {
            const blob = new Blob(this.video.recordedChunks, { type: 'video/webm' });
            const videoURL = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = videoURL;
            downloadLink.download = 'wanim_output.webm'; 
            downloadLink.click();
        };
    }

    finishPlaying() { 
        return new Promise(resolve => { 
            if (!this._playing) { 
                resolve();
            }
            this.onFinishAnimation(resolve);
        })
    }

    redraw() {
        this._clear();
        for (let object of this.scene.objects) {
            this._draw(object);
        }
    }

    clear() {
        this.scene.objects = [];
        this._clear();
    }

    onFinishAnimation(handler) { 
        this._onFinishAnimation.push(handler);
    }

    play(...animations) {
        for (let animation of animations) {
            if (animation instanceof WanimObject || animation instanceof WanimCollection) {
                this._addToScene(animation);
            } else if (animation instanceof WanimObjectAnimation || animation instanceof WanimCollectionAnimation || animation instanceof AnimationSet) {
                this.addAnimation(animation);
            } else if (animation instanceof RenderedCollection) { 
                if (animation.animated) {
                    this.addAnimation(animation.animations);
                } else { 
                    this._addToScene(animation.collection);
                }
            }
        }
    }

    addAnimation(animation, ) {
        this.animationQueue.unshift(animation);
        if (!this._playing)
            this.playAnimationQueue();
    }

    playAnimationQueue() {
        let animation = this.animationQueue.pop();
        if (!animation) return;
        this._playing = true;
        this.animate(animation, true);
    }

    animate(animation, playNext = true) {
        let t = 0;
        let startTime = Date.now();
        let prevTime = startTime;
        let objectIndex;
        const drawFrame = () => {
            this.scene.members[objectIndex] = animation.frame(t);
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
        }
        objectIndex = this.scene.add(animation.frame(0));
        requestAnimationFrame(drawFrame);
    }

    remove(object) {
        this.scene.remove(object);
    }

    _clear() {
        this.gl.clearColor(...this.backgroundColor, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    _draw(object) {
        if (!object) return;
        let vertices = object.normalizedTriangulation(this.canvas.width, this.canvas.height);
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const position = this.gl.getAttribLocation(this.gl.program, 'position');

        this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);

        const colorLoc = this.gl.getUniformLocation(this.gl.program, "color");
        this.gl.uniform4fv(colorLoc, [...object.color, object.opacity]);

        const n = vertices.length / 3;
        this.gl.drawArrays(this.gl.TRIANGLES, 0, n);
    }

    _initShaders() {
        const makeShader = (glsl, type) => {
            const shader = this.gl.createShader(type);
            this.gl.shaderSource(shader, glsl);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw Error(`Error compiling shader: ${this.gl.getShaderInfoLog(shader)}`);
            }
            return shader;
        }

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
        this.gl.program = program;
    }

    _addToScene(object) { 
        this.scene.add(object);
        this.redraw();
        this._finishedAnimation();
    }

    _finishedAnimation() { 
        this._onFinishAnimation.map(x => x());
    }
};

export const WanimScene = class {
    constructor(...members) {
        this.members = members;
    }

    get objects() {
        return this.members.map(x => (x instanceof WanimCollection) ? x.objects : x).flat();
    }

    add(object) {
        if (object instanceof WanimCollection || object instanceof WanimObject) {
            return this.members.push(object) - 1;
        }
        return this;
    }

    remove(object) {
        this.objects = this.objects.filter(x => x !== object);
        return this;
    }

    removeIndex(index) {
        this.members.splice(index, 1);
        return this;
    }
}