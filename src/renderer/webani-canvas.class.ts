import { CanvasAnimationState } from "./types/canvas-animation-state.type";
import { CanvasUpdateLoop } from "./types/canvas-update-loop.type";
import { Playable } from "./types/playable.type";
import { ShaderSet } from "./types/shader-set.type";
import { Vector3 } from "./types/vector3.type";
import { WebaniAnimation } from "./animation/webani-animation.class";
import { brdfLUTComputeShaderSet, irradianceComputeShaderSet, objectShaderSet, prefilterComputeShaderSet, skyboxShaderSet } from "./scene/lighting/shaders/shaders";
import { Colors } from "./scene/lighting/colors";
import { WebaniPrimitiveObject } from "./scene/webani-primitive-object.class";
import { WebaniScene } from "./scene/webani-scene.class";
import { WebaniSkybox } from "./webani-skybox.class";
import { WebaniTransformable } from "./scene/webani-transformable.class";

/**
 * Represents the options for configuring a Webani canvas.
 * @typedef {Object} WebaniRendererOptions
 * @property {HTMLCanvasElement} canvas - The HTML canvas element to render on.
 * @property {Vector3} [backgroundColor=Colors.BLACK] - The background color of the canvas.
 * @property {boolean} [antialias=true] - Whether or not antialiasing should be enabled.
 */
export type WebaniRendererOptions = {
    canvas: HTMLCanvasElement,
    backgroundColor?: Vector3,
    antialias?: boolean,
};

export class WebaniCanvas {
    /**
         * The HTMLCanvasElement associated with the Webani canvas.
         * @type {HTMLCanvasElement}
         */
    htmlCanvas: HTMLCanvasElement;

    /**
     * The WebGL2 rendering context for drawing on the canvas.
     * @type {WebGL2RenderingContext}
     */
    gl: WebGL2RenderingContext;

    /**
     * The background color for the canvas.
     * @type {Vector3}
     */
    backgroundColor: Vector3;

    /**
     * Queue of animations that are to be played.
     * @private
     * @type {WebaniAnimation[]}
     */
    private animationQueue: WebaniAnimation[];

    /**
     * List of update loop handlers that will be called on every frame.
     * @private
     * @type {CanvasUpdateLoop[]}
     */
    private updateLoops: CanvasUpdateLoop[];

    /**
     * List of handlers that are called when an animation finishes.
     * @private
     * @type {(() => void)[]}
     */
    private animationFinishedHandlers: (() => void)[];

    /**
     * List of handlers that are called when the entire animation queue finishes.
     * @private
     * @type {(() => void)[]}
     */
    private animationQueueFinishedHandlers: (() => void)[];

    /**
     * Boolean flag indicating whether the rendering has started.
     * @private
     * @type {boolean}
     */
    private started = false;

    /**
     * Video-related information, used for recording the canvas output.
     * @private
     * @type {{ recordedChunks?: BlobPart[]; mediaRecorder?: MediaRecorder }}
     */
    private video: {
        recordedChunks?: BlobPart[];
        mediaRecorder?: MediaRecorder;
    };

    /**
     * The scene that contains all the objects, cameras, lights, etc.
     * @type {WebaniScene}
     */
    scene!: WebaniScene;

    /**
     * Boolean flag indicating whether the canvas is paused.
     * @private
     * @type {boolean}
     */
    private paused = false;

    /**
     * The skybox for the scene, optional.
     * @type {WebaniSkybox | undefined}
     */
    skybox?: WebaniSkybox;

    /**
     * Record of shader programs associated with the canvas.
     * @private
     * @type {Record<string, WebGLProgram>}
     */
    private shaderPrograms: Record<string, WebGLProgram> = {};

    /**
     * Record of attribute locations for shaders.
     * @private
     * @type {object}
     */
    private attributeLocations: object = {};

    /**
     * Record of attribute buffers for shaders.
     * @private
     * @type {object}
     */
    private attributeBuffers: object = {};

    /**
     * The default WebaniCanvas instance.
     * @static
     * @type {WebaniCanvas}
     */
    static defaultCanvas?: WebaniCanvas;

    /**
     * Creates an instance of the WebaniCanvas class.
     * @param {WebaniRendererOptions} options - The configuration options for the canvas.
     * @throws {Error} If WebGL cannot be initialized.
     */
    constructor({
        canvas, 
        backgroundColor = Colors.BLACK,
        antialias = true,
    }: WebaniRendererOptions) {
        if (!canvas)
            throw Error("A canvas object must be provided to create a Webani canvas element.");

        this.htmlCanvas = canvas;
        this.gl = canvas.getContext("webgl2", { antialias, alpha: true });
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

    /**
     * Retrieves the location of a shader variable.
     * @param {string} name - The name of the shader variable.
     * @returns {WebGLUniformLocation | null} The location of the shader variable.
     */
    getShaderVariableLocation(name: string) { 
        return this.attributeLocations[name];
    }

    /**
     * Sets the skybox of the scene.
     * @param {ImageBitmap[]} images - The images for the skybox.
     */
    setSkybox(images: ImageBitmap[]) {
        this.pause();
        this.skybox = new WebaniSkybox(this, images);
        this.resume();
    }

    /**
     * Sets the skybox as a solid background color.
     * @param {Vector3} color - The color to set as the background.
     */
    async setSolidBackground(color: Vector3) { 
        this.pause();
        this.backgroundColor = color;
        this.skybox = await WebaniSkybox.solidColor(this);
        this.resume();
    }

    /**
     * Starts recording the canvas output as a video.
     */
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

    /**
     * Stops the recording and saves the video as a file after the most recently added animation finishes playing.
     * @returns {Promise<void>} A promise that resolves once the recording is finished.
     */
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

    /**
     * Waits for all animations in the queue to finish.
     * @returns {Promise<void>} A promise that resolves when all animations finish.
     */
    finishPlaying(): Promise<void> {
        return new Promise(resolve => {
            if (this.animationQueue.length == 0) { 
                resolve();
            }
            this.onFinishAnimationQueue(resolve);
        });
    }

    /**
     * Redraws the scene, including the skybox and objects.
     */
    redraw(): void {
        this.glClear();
        this.drawSkybox();
        this.drawObjects();
    }

    /**
     * Clears the canvas with WebGL.
     */
    glClear(): void {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthMask(true);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.clearDepth(1.0);
        this.gl.viewport(0, 0, this.htmlCanvas.width, this.htmlCanvas.height);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Clears the scene and resets the canvas.
     */
    clear(): void {
        this.scene.clear();
        this.glClear();
    }

    /**
     * Pauses the rendering of the scene.
     */
    pause() { 
        this.paused = true;
    }

    /**
     * Resumes the rendering of the scene.
     */
    resume() { 
        this.paused = false;
    }

    /**
     * Starts rendering the provided animations on the canvas.
     * @param {Playable[]} animations - The animations to render.
     */
    render(...animations: Playable[]): void {
        for (const animation of animations) {
            if (animation instanceof WebaniAnimation) {
                this.addAnimation(animation);
            } else {
                this.addToScene(animation);
            }    
        }
        this.start();
    }

    /**
     * Registers an update loop to be called on every frame.
     * @param {CanvasUpdateLoop} handler - The handler to call every frame.
     */
    onUpdate(handler: CanvasUpdateLoop): void {
        this.updateLoops.push(handler);
        this.start();
    }

    /**
     * Registers a handler to be called when the entire animation queue finishes.
     * @param {() => void} handler - The handler to call when the queue finishes.
     */
    onFinishAnimationQueue(handler: () => void): void {
        this.animationQueueFinishedHandlers.push(handler);
    }

    /**
     * Registers a handler to be called when a single animation finishes.
     * @param {() => void} handler - The handler to call when an animation finishes.
     */
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
        if (animationState.objectIndex === undefined) { 
            animationState.objectIndex = this.scene.add(frame);
        }
        this.scene._members[animationState.objectIndex] = frame;
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
        const z = this.htmlCanvas.width / (2 * Math.tan(this.scene.camera.fov));
        this.scene.camera.far = 10000 + z;
        this.scene.camera.transform.position[2] = z;
        this.skybox ??= await WebaniSkybox.solidColor(this);
    }

    private drawSkybox() {
        this.changeShaderProgram("skybox");

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skybox.cubeMapTexture);

        this.gl.depthMask(false);
        this.gl.depthFunc(this.gl.LEQUAL);

        const camera = this.scene.camera;

        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uProjectionMatrix"), true, camera.projectionMatrix(this.htmlCanvas.width, this.htmlCanvas.height));
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uViewMatrix"), true, camera.viewMatrix);

        this.gl.uniform1i(this.getShaderVariableLocation("uHDRTexture"), 0);

        this.bindAttributeBuffer("position", this.skybox.cubeVertices, 3);
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.skybox.cubeVertices.length / 3);
        this.gl.depthMask(true);
        this.gl.depthFunc(this.gl.LESS);
    }

    private drawObjects() { 
        this.changeShaderProgram("object");
        for (const object of this.scene.getObjectsForRender) {
            if (object instanceof WebaniPrimitiveObject) {
                this.drawObject(object);
            }
        }
    }

    private drawObject(object: WebaniPrimitiveObject) {
        object.material.bindToContext(this.gl);
        const triangles = object.triangles;
        this.bindAttributeBuffer("position", triangles, 3);
        this.bindAttributeBuffer("normal", object.normals, 3);
        this.bindAttributeBuffer("uv", object.UVs, 2);
        this.bindAttributeBuffer("jointIndices", object.jointIndices, 4);
        this.bindAttributeBuffer("weights", object.weights, 4);
        if (object.performSkinningTransformation) {
            this.gl.uniform1i(this.getShaderVariableLocation("performSkinningTransformation"), 1);
            this.gl.uniformMatrix4fv(this.getShaderVariableLocation("inverseBindMatrices[0]"), false, object.inverseBindMatrices);
            this.gl.uniformMatrix4fv(this.getShaderVariableLocation("jointMatrices[0]"), true, object.jointObjectMatrices);
        }

        const camera = this.scene.camera; 
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uProjectionMatrix"), true, camera.projectionMatrix(this.htmlCanvas.width, this.htmlCanvas.height));
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uViewMatrix"), true, camera.viewMatrix);
        this.gl.uniformMatrix4fv(this.getShaderVariableLocation("uModelMatrix"), true, object.modelMatrix)
        this.gl.uniform3fv(this.getShaderVariableLocation("uCameraPosition"), camera.position);
        this.gl.uniform3fv(this.getShaderVariableLocation("uLightPositions[0]"), this.scene.lightPositions);
        this.gl.uniform3fv(this.getShaderVariableLocation("uLightColors[0]"), this.scene.lightColors);
        this.gl.uniform1fv(this.getShaderVariableLocation("uLightIntensities[0]"), this.scene.lightIntensities);
        this.gl.uniform1i(this.getShaderVariableLocation("uNumLights"), this.scene.numLights);

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
        
        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, object.material.baseColorTexture);
        this.gl.uniform1i(this.getShaderVariableLocation("uBaseColorTexture"), 3);

        if (object.material.baseColorTexture) {
            this.gl.uniform1i(this.getShaderVariableLocation("uBaseColorTextureSupplied"), 1);
        }

        this.gl.activeTexture(this.gl.TEXTURE4);
        this.gl.bindTexture(this.gl.TEXTURE_2D, object.material.metallicRoughnessTexture);
        this.gl.uniform1i(this.getShaderVariableLocation("uMetallicRoughnessTexture"), 4);
        if (object.material.metallicRoughnessTexture) {
            this.gl.uniform1i(this.getShaderVariableLocation("uMetallicRoughnessTextureSupplied"), 1);
        }
        
        this.gl.activeTexture(this.gl.TEXTURE5);
        this.gl.bindTexture(this.gl.TEXTURE_2D, object.material.normalMap);
        this.gl.uniform1i(this.getShaderVariableLocation("uNormalMap"), 5);
        if (object.material.normalMap) {
            this.gl.uniform1i(this.getShaderVariableLocation("uNormalMapSupplied"), 1);
        }
   
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

    bindAttributeBuffer(attribName: string, data: AllowSharedBufferSource, size: number): void {
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

    private addToScene(object: WebaniTransformable): void {
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
