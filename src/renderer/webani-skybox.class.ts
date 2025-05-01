import { Matrix4 } from "./types/matrix4.type";
import { WebaniPerspectiveCamera } from "./scene/camera/webani-perspective-camera.class";
import { WebaniCanvas } from "./webani-canvas.class";

/**
 * Represents a skybox for a WebGL-based scene, including PBR-related maps like irradiance,
 * prefiltered environment maps, and BRDF LUTs.
 */
export class WebaniSkybox {
    /** Input cube map images for the skybox. One per face. */
    images: ImageBitmap[];

    /** Width and height (in pixels) of the cube map textures. */
    textureSize: number;

    /** Vertex positions used to render a cube for environment mapping. */
    cubeVertices: Float32Array;

    /** Vertex positions used to render a full-screen quad. */
    quadVertices: Float32Array;

    /** WebGL cube texture representing the skybox. */
    cubeMapTexture!: WebGLTexture;

    /** Normal map texture used in IBL (if needed). */
    normalMapTexture!: WebGLTexture;

    /** Cube texture storing irradiance map for diffuse lighting. */
    irradianceTexture!: WebGLTexture;

    /** Cube texture storing prefiltered environment map for specular IBL. */
    prefilteredTexture!: WebGLTexture;

    /** Internal reference to cube map face enums used in rendering. */
    faces!: number[];

    /** View matrices for each face of the cube map. */
    cameraModelMatrices!: Matrix4[];

    /** Projection matrix used to render the cube faces. */
    projectionMatrix!: Matrix4;

    /** Surface roughness used in specular reflection calculations. */
    roughness: number;

    /** Static texture used for BRDF LUT (shared across instances). */
    static brdfLUTTexture: WebGLTexture;

    /**
     * Creates a skybox with the given cube map images and optional roughness for PBR.
     * @param canvas The canvas context used for rendering and texture creation.
     * @param images Array of 6 ImageBitmap objects representing cube map faces.
     * @param roughness Optional roughness value (default is 1.0).
     */
    constructor(canvas: WebaniCanvas, images: ImageBitmap[], roughness: number = 1.0) {
        this.images = images;
        this.textureSize = images[0].width;
        this.cubeVertices = new Float32Array([
            1, 1, -1,  1, -1, -1,  1, -1, 1,
            1, -1, 1,  1, 1, 1,  1, 1, -1,
          
            -1, 1, 1,  -1, -1, 1,  -1, -1, -1,
            -1, -1, -1,  -1, 1, -1,  -1, 1, 1,
          
            -1, 1, -1,  1, 1, -1,  1, 1, 1,
            1, 1, 1,  -1, 1, 1,  -1, 1, -1,
          
            -1, -1, 1,  1, -1, 1,  1, -1, -1,
            1, -1, -1,  -1, -1, -1,  -1, -1, 1,
          
            1, 1, 1,  1, -1, 1,  -1, -1, 1,
            -1, -1, 1,  -1, 1, 1,  1, 1, 1,
          
            -1, 1, -1,  -1, -1, -1,  1, -1, -1,
            1, -1, -1,  1, 1, -1,  -1, 1, -1,
        ]);

        this.quadVertices = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
             1.0,  1.0,
            -1.0, -1.0,
             1.0,  1.0,
            -1.0,  1.0
        ]);

        this.roughness = roughness;
        this.reloadSkybox(canvas);
    }

    /**
     * Creates a solid color skybox from the canvas background color.
     * Useful as a fallback or for non-environmental scenes.
     * @param canvas The WebaniCanvas instance.
     * @returns A WebaniSkybox instance with a single-color cube map.
     */
    static async solidColor(canvas: WebaniCanvas) {
        const image = new ImageData(256, 256);
        for (let i = 0; i < image.data.length; i += 4) {
            image.data[i] = Math.ceil(canvas.backgroundColor[0] * 255);
            image.data[i + 1] = Math.ceil(canvas.backgroundColor[1] * 255);
            image.data[i + 2] = Math.ceil(canvas.backgroundColor[2] * 255);
            image.data[i + 3] = 255;
        }           
        const ibm = await createImageBitmap(image);
        return new WebaniSkybox(canvas, [ibm, ibm, ibm, ibm, ibm, ibm]);
    }

    /**
     * Reloads all skybox-related resources, including textures and geometry.
     * Useful when changing environment maps or shader settings.
     * @param canvas The rendering canvas context.
     */
    reloadSkybox(canvas: WebaniCanvas) {
        this.createGeometry(canvas);
        this.createTextures(canvas);
    }

    private createTextures(canvas: WebaniCanvas) { 
        this.cubeMapTexture = this.createCubemapTexture(canvas);
        this.irradianceTexture = this.createIrradianceMap(canvas);
        this.prefilteredTexture = this.createPrefilterMap(canvas);
        WebaniSkybox.brdfLUTTexture ??= this.createBRDFLUT(canvas);
    }

    private createGeometry(canvas: WebaniCanvas) {
        this.faces = [
            canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        
        const camera = new WebaniPerspectiveCamera({
            position: [0, 0, 0], 
            rotation: [0, 0, 0], 
            fov: 90, 
            near: 0.1, 
            far: 10
        });
        this.projectionMatrix = camera.projectionMatrix(this.textureSize, this.textureSize);
        this.cameraModelMatrices = this.faces.map((face) => {
            switch (face) {
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_X:
                    camera.transform.rotation = [0, 90, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
                    camera.transform.rotation = [0, -90, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
                    camera.transform.rotation = [-90, 180, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
                    camera.transform.rotation = [90, 180, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
                    camera.transform.rotation = [0, 180, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
                    camera.transform.rotation = [0, 0, 0];
                    break;
            }
            return camera.viewMatrix;
        });
    }

    private createCubemapTexture(canvas: WebaniCanvas): WebGLTexture {
        const gl = canvas.gl;
        const texture = gl.createTexture();
        canvas.gl.bindTexture(canvas.gl.TEXTURE_CUBE_MAP, texture);
        
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        this.faces.forEach((face, i) => {
            gl.texImage2D(
                face,
                0,
                gl.RGB,
                this.textureSize, this.textureSize, 0,
                gl.RGB,
                gl.UNSIGNED_BYTE,
                this.images ? this.images[i] : null
            );
        });

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        return texture;
    }

    private createIrradianceMap(canvas: WebaniCanvas): WebGLTexture {
        canvas.changeShaderProgram("irradianceCompute");
        const gl = canvas.gl;
        const texture = gl.createTexture();
        const irradianceSize = 32;

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        this.faces.forEach(face => {
            gl.texImage2D(
                face,
                0,
                gl.RGB,
                irradianceSize, irradianceSize, 0,
                gl.RGB,
                gl.UNSIGNED_BYTE,
                null
            );
        });
    
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, irradianceSize, irradianceSize);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMapTexture);

        gl.uniform1i(canvas.getShaderVariableLocation("uCubeMap"), 0); 
        canvas.bindAttributeBuffer("position", this.cubeVertices, 3);
        gl.uniformMatrix4fv(canvas.getShaderVariableLocation("uProjectionMatrix"), true, this.projectionMatrix);
        
        this.faces.forEach((face, i) => {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, texture, 0);
            gl.uniformMatrix4fv(canvas.getShaderVariableLocation("uViewMatrix"), true, this.cameraModelMatrices[i]);
            canvas.glClear();
            gl.viewport(0, 0, irradianceSize, irradianceSize);
            gl.drawArrays(gl.TRIANGLES, 0, this.cubeVertices.length / 3);
        });
 
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.deleteRenderbuffer(renderBuffer);
        gl.deleteFramebuffer(framebuffer);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        return texture;
    }

    private createPrefilterMap(canvas: WebaniCanvas): WebGLTexture {
        canvas.changeShaderProgram("prefilterCompute");
        const gl = canvas.gl;
        const texture = gl.createTexture();
        const size = 512;

        const maxMipLevels = Math.floor(Math.log2(size)) + 1;
    
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    
        for (let mip = 0; mip < maxMipLevels; mip++) {
            const mipWidth = Math.max(1, size >> mip);
            const mipHeight = Math.max(1, size >> mip);
    
            this.faces.forEach(face => {
                gl.texImage2D(
                    face,
                    mip,
                    gl.RGB,
                    mipWidth, mipHeight, 0,
                    gl.RGB,
                    gl.UNSIGNED_BYTE,
                    null
                );
            });
        }
    
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMapTexture);
        gl.uniform1i(canvas.getShaderVariableLocation("uCubeMap"), 0);
        gl.uniformMatrix4fv(canvas.getShaderVariableLocation("uProjectionMatrix"), true, this.projectionMatrix);

        canvas.bindAttributeBuffer("position", this.cubeVertices, 3);
    
        for (let mip = 0; mip < maxMipLevels; mip++) {
            const mipWidth = Math.max(1, size >> mip);
            const mipHeight = Math.max(1, size >> mip);
            const roughness = mip / (maxMipLevels - 1);
    
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mipWidth, mipHeight);
            gl.uniform1f(canvas.getShaderVariableLocation("uRoughness"), roughness);
            gl.uniform1f(canvas.getShaderVariableLocation("uResolution"), mipWidth);
    
            this.faces.forEach((face, i) => {
                gl.uniformMatrix4fv(canvas.getShaderVariableLocation("uViewMatrix"), true, this.cameraModelMatrices[i]);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, texture, mip);
                canvas.glClear();
                gl.viewport(0, 0, mipWidth, mipHeight);
                gl.drawArrays(gl.TRIANGLES, 0, this.cubeVertices.length / 3);
            });
        }
    
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.deleteRenderbuffer(renderBuffer);
        gl.deleteFramebuffer(framebuffer);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    
        return texture;
    }

    private createBRDFLUT(canvas: WebaniCanvas): WebGLTexture {
        canvas.changeShaderProgram("brdfLUTCompute");
        const gl = canvas.gl;
        const size = 512;
    
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            size, size, 0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        );
        canvas.bindAttributeBuffer("position", this.quadVertices, 2);

        gl.viewport(0, 0, size, size);
        canvas.glClear();
        gl.drawArrays(gl.TRIANGLES, 0, this.quadVertices.length / 2);
   
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }
}