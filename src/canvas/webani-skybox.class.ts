import { WebaniPerspectiveCamera } from "../camera/webani-perspective-camera.class";
import { Matrix4 } from "../types/matrix4.type";
import { WebaniCanvas } from "./webani-canvas.class";

export class WebaniSkybox {
    image: ImageBitmap;
    vertices: Float32Array;
    texture!: WebGLTexture;
    irradianceTexture!: WebGLTexture;
    prefilteredTexture!: WebGLTexture;
    brdfLUTTexture!: WebGLTexture;
    faces!: number[];
    viewMatrices!: Matrix4[]

    constructor(image: ImageBitmap, canvas: WebaniCanvas) {
        this.image = image;
        this.vertices = new Float32Array([
            // Right
            1, 1, -1,  1, -1, -1,  1, -1, 1,
            1, -1, 1,  1, 1, 1,  1, 1, -1,
          
            // Left
            -1, 1, 1,  -1, -1, 1,  -1, -1, -1,
            -1, -1, -1,  -1, 1, -1,  -1, 1, 1,
          
            // Top
            -1, 1, -1,  1, 1, -1,  1, 1, 1,
            1, 1, 1,  -1, 1, 1,  -1, 1, -1,
          
            // Bottom
            -1, -1, 1,  1, -1, 1,  1, -1, -1,
            1, -1, -1,  -1, -1, -1,  -1, -1, 1,
          
            // Front
            1, 1, 1,  1, -1, 1,  -1, -1, 1,
            -1, -1, 1,  -1, 1, 1,  1, 1, 1,
          
            // Back
            -1, 1, -1,  -1, -1, -1,  1, -1, -1,
            1, -1, -1,  1, 1, -1,  -1, 1, -1,
        ]);

        this.reloadSkybox(canvas);
    }

    reloadSkybox(canvas: WebaniCanvas) {
        this.generateViewMatrices(canvas);
        this.texture = this.createCubemapTexture(canvas);
        // this.irradianceTexture = this.createIrradianceMap(canvas);
        // this.prefilteredTexture = this.createPrefilterMap(gl);
        // this.brdfLUTTexture = this.createBRDFLUT(gl);
    }

    private generateViewMatrices(canvas: WebaniCanvas) {
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
                256, 256, 0, // smaller size for irradiance map
                gl.RGB,
                gl.UNSIGNED_BYTE,
                null
            );
        });

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        this.computeIrradianceMap(canvas, texture);
        return texture;
    }

    // Create prefiltered environment map
    private createPrefilterMap(gl: WebGL2RenderingContext): WebGLTexture {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        this.faces.forEach(face => {
            gl.texImage2D(
                face,
                0,
                gl.RGB,
                512, 512, 0,
                gl.RGB,
                gl.UNSIGNED_BYTE,
                this.image
            );
        });

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        this.computePrefilteredMap(gl, texture);
        return texture;
    }

    createBRDFLUT(gl: WebGL2RenderingContext): WebGLTexture {
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
        this.computeBRDFLUT(gl, texture);
        return texture;
    }

    private computeIrradianceMap(canvas: WebaniCanvas, texture: WebGLTexture) {
        const gl = canvas.gl;
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 256, 256);  // Set resolution for irradiance map
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
    
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, texture, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw Error("An unknown error occurred when creating framebuffer for computing irradiance map.");
        }
    
        canvas.changeShaderProgram("computeIrradiance");
    
        const cubeMapLocation = canvas.attributeLocations["uCubeMap"];
        gl.uniform1i(cubeMapLocation, 0); 
    
        const deltaThetaLocation = canvas.attributeLocations["uDeltaTheta"];
        gl.uniform1f(deltaThetaLocation, Math.PI / 64);
    
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    
        this.faces.forEach(face => {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, texture, 0);
            canvas.glClear();
            const viewMatrix = this.viewMatrices[face];
            const viewLocation = canvas.attributeLocations["uViewMatrix"];
            gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        });
 
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private computePrefilteredMap(gl: WebGL2RenderingContext, texture: WebGLTexture) {

    }

    private computeBRDFLUT(gl: WebGL2RenderingContext, texture: WebGLTexture) {

    }
}