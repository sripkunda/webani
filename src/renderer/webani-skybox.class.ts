import { Matrix4 } from "../types/matrix4.type";
import { WebaniPerspectiveCamera } from "./scene/webani-perspective-camera.class";
import { WebaniCanvas } from "./webani-canvas.class";

export class WebaniSkybox {
    images: ImageBitmap[];
    textureSize: number;
    cubeVertices: Float32Array;
    quadVertices: Float32Array;
    cubeMapTexture!: WebGLTexture;
    normalMapTexture!: WebGLTexture;
    irradianceTexture!: WebGLTexture;
    prefilteredTexture!: WebGLTexture;
    faces!: number[];
    viewMatrices!: Matrix4[];
    projectionMatrix!: Matrix4;
    roughness: number;
    
    static brdfLUTTexture: WebGLTexture;

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

    static async fallback(canvas: WebaniCanvas) {
        if (canvas.skybox) return canvas.skybox;
        const image = new ImageData(256, 256);
        for (let i = 0; i < image.data.length; i += 4) {
            image.data[i] = Math.ceil(canvas.backgroundColor[0] * 255);
            image.data[i + 1] = Math.ceil(canvas.backgroundColor[1] * 255);
            image.data[i + 2] = Math.ceil(canvas.backgroundColor[2] * 255);
            image.data[i + 3] = 255;
        }           
        const ibm = await createImageBitmap(image);
        return canvas.skybox || new WebaniSkybox(canvas, [ibm, ibm, ibm, ibm, ibm, ibm]);
    }

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
        this.viewMatrices = this.faces.map((face) => {
            switch (face) {
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_X:
                    camera.transform.rotation = [0, -90, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
                    camera.transform.rotation = [0, 90, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
                    camera.transform.rotation = [-90, 0, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
                    camera.transform.rotation = [90, 0, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
                    camera.transform.rotation = [0, 0, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
                    camera.transform.rotation = [0, 180, 0];
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
            gl.uniformMatrix4fv(canvas.getShaderVariableLocation("uViewMatrix"), true, this.viewMatrices[i]);
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
        const size = 256;

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
                gl.uniformMatrix4fv(canvas.getShaderVariableLocation("uViewMatrix"), true, this.viewMatrices[i]);
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