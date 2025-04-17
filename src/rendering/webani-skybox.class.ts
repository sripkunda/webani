import { WebaniPerspectiveCamera } from "../camera/webani-perspective-camera.class";
import { Matrix4 } from "../types/matrix4.type";
import { Vector3 } from "../types/vector3.type";
import { WebaniCanvas } from "./webani-canvas.class";

export class WebaniSkybox {
    image: ImageBitmap;
    cubeVertices: Float32Array;
    quadVertices: Float32Array;
    cubeMapTexture!: WebGLTexture;
    normalMapTexture!: WebGLTexture;
    irradianceTexture!: WebGLTexture;
    prefilteredTexture!: WebGLTexture;
    brdfLUTTexture!: WebGLTexture;
    faces!: number[];
    viewMatrices!: Matrix4[];
    normalVectors: Vector3[];
    roughness = 1.0;

    constructor(image: ImageBitmap, canvas: WebaniCanvas, roughness: number = 1.0) {
        this.image = image;
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
            -1.0,  1.0,
            -1.0, -1.0,
             1.0,  1.0,
             1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0
        ])
        this.roughness = roughness;
        this.reloadSkybox(canvas);
    }

    reloadSkybox(canvas: WebaniCanvas) {
        this.createGeometry(canvas);
        this.createTextures(canvas);
    }

    private createTextures(canvas: WebaniCanvas) { 
        this.cubeMapTexture = this.createCubemapTexture(canvas);
        this.irradianceTexture = this.createIrradianceMap(canvas);
        this.prefilteredTexture = this.createPrefilterMap(canvas);
        // this.brdfLUTTexture = this.createBRDFLUT(gl);
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
        
        const camera = new WebaniPerspectiveCamera();
        this.viewMatrices = this.faces.map((face) => {
            switch (face) {
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_X:
                    camera.transform.rotation = [0, 90, 0];
                    break;
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
                    camera.transform.rotation = [0, -90, 0];
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

        this.normalVectors = this.faces.map((face) => {
            switch (face) {
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_X:
                    return [1, 0, 0];
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
                    return [-1, 0, 0];
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
                    return [0, 1, 0];
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
                    return [0, -1, 0];
                case canvas.gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
                    return [0, 0, 1];
                case canvas.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
                    return [0, 0, -1];
            }
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

        this.faces.forEach(face => {
            gl.texImage2D(
                face,
                0,
                gl.RGB,
                gl.RGB,
                gl.UNSIGNED_BYTE,
                this.image 
            );
        });

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        return texture;
    }

    private createIrradianceMap(canvas: WebaniCanvas): WebGLTexture {
        const gl = canvas.gl;
        const texture = gl.createTexture();

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
                this.image.width, this.image.height, 0,
                gl.RGB,
                gl.UNSIGNED_BYTE,
                null
            );
        });
    
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, this.image.width, this.image.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
    
        canvas.changeShaderProgram("irradianceCompute");

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMapTexture);

        gl.uniform1i(canvas.attributeLocations["uCubeMap"], 0); 
        gl.uniform1f(canvas.attributeLocations["uDeltaTheta"], 0.025);
        canvas.bindAttributeBuffer("position", this.cubeVertices, 3);
    
        this.faces.forEach((face, i) => {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, texture, 0);
            gl.uniformMatrix4fv(canvas.attributeLocations["uViewMatrix"], true, this.viewMatrices[i]);
            canvas.glClear();
            gl.viewport(0, 0, this.image.width, this.image.height);
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
        const gl = canvas.gl;
        const texture = gl.createTexture();
        const baseWidth = this.image.width;
        const baseHeight = this.image.height;
    
        const maxMipLevels = Math.floor(Math.log2(baseWidth)) + 1;
    
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    
        // Allocate texture storage for each face and mip level
        for (let mip = 0; mip < maxMipLevels; mip++) {
            const mipWidth = Math.max(1, baseWidth >> mip);
            const mipHeight = Math.max(1, baseHeight >> mip);
    
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
    
        canvas.changeShaderProgram("prefilterCompute");
    
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMapTexture);
        gl.uniform1i(canvas.attributeLocations["uCubeMap"], 0);
    
        canvas.bindAttributeBuffer("position", this.cubeVertices, 3);
    
        for (let mip = 0; mip < maxMipLevels; mip++) {
            const mipWidth = Math.max(1, baseWidth >> mip);
            const mipHeight = Math.max(1, baseHeight >> mip);
            const roughness = mip / (maxMipLevels - 1);
    
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mipWidth, mipHeight);
            gl.uniform1f(canvas.attributeLocations["uRoughness"], roughness);
            gl.uniform1f(canvas.attributeLocations["uResolution"], mipWidth);
    
            this.faces.forEach((face, i) => {
                gl.uniformMatrix4fv(canvas.attributeLocations["uViewMatrix"], true, this.viewMatrices[i]);
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

    createBRDFLUT(canvas: WebaniCanvas): WebGLTexture {
        const gl = canvas.gl;
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
            512, 512, 0,
            gl.RGBA,
            gl.FLOAT,
            null
        );

        gl.bindTexture(gl.TEXTURE_2D, null);
        
        return texture;
    }
}