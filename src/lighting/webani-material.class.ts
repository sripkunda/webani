import { Vector3 } from "../types/vector3.type";
import { Colors } from "./colors";

export type WebaniMaterialOptions = {
    color?: Vector3;
    metallic?: number;
    roughness?: number;
    opacity?: number;
    baseColorImage?: ImageBitmap;
    metallicRoughnessImage?: ImageBitmap;
    normalMapImage?: ImageBitmap;
    normalScale?: number;
};

export class WebaniMaterial {
    color: Vector3;
    roughness: number;
    metallic: number;
    opacity: number;
    baseColorImage?: ImageBitmap;
    metallicRoughnessImage?: ImageBitmap;
    normalMapImage?: ImageBitmap;
    normalScale?: number;

    baseColorTexture: WebGLTexture;
    metallicRoughnessTexture: WebGLTexture;
    normalMapTexture: WebGLTexture;

    private boundGLContexts: Set<WebGL2RenderingContext> = new Set<WebGL2RenderingContext>();

    constructor({
        color = Colors.BLACK,
        metallic = 0,
        roughness = 0,
        opacity = 1,
        baseColorImage,
        metallicRoughnessImage,
        normalMapImage,
        normalScale,
    }: WebaniMaterialOptions) {
        this.color = color;
        this.metallic = metallic;
        this.roughness = roughness;
        this.opacity = opacity;
        this.baseColorImage = baseColorImage;
        this.metallicRoughnessImage = metallicRoughnessImage;
        this.normalMapImage = normalMapImage;
        this.normalScale = normalScale;
    }

    private fillTextureWithImage(gl: WebGL2RenderingContext, texture: WebGLTexture, image: ImageBitmap) { 
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            image.width, image.height, 0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    bindToContext(gl: WebGL2RenderingContext) { 
        if (this.boundGLContexts.has(gl)) { 
            return;
        } else {
            this.generateTextures(gl);
            this.boundGLContexts.add(gl);
        }
    }

    generateTextures(gl: WebGL2RenderingContext) {
        if (this.baseColorTexture) {
            gl.deleteTexture(this.baseColorTexture);
        }
        if (this.baseColorImage) { 
            this.baseColorTexture = gl.createTexture();
        }

        if (this.metallicRoughnessTexture) {
            gl.deleteTexture(this.metallicRoughnessTexture);
        }
        if (this.metallicRoughnessImage) { 
            this.metallicRoughnessTexture = gl.createTexture();
        }

        if (this.normalMapTexture) {
            gl.deleteTexture(this.normalMapTexture);
        }
        if (this.normalMapImage) { 
            this.normalMapTexture = gl.createTexture();
        }

        this.fillTextureWithImage(gl, this.baseColorTexture, this.baseColorImage);
        this.fillTextureWithImage(gl, this.metallicRoughnessTexture, this.metallicRoughnessImage);
        this.fillTextureWithImage(gl, this.normalMapTexture, this.normalMapImage);
    }

    get copy() {
        return new WebaniMaterial({
            color: this.color,
            metallic: this.metallic,
            roughness: this.roughness,
            opacity: this.opacity,
            baseColorImage: this.baseColorImage,
            metallicRoughnessImage: this.metallicRoughnessImage,
            normalMapImage: this.normalMapImage,
            normalScale: this.normalScale
        });
    }
}
