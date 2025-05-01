import { Vector3 } from "../../types/vector3.type";
import { Colors } from "./colors";

/**
 * Options for initializing a WebaniMaterial.
 */
export type WebaniMaterialOptions = {
    /**
     * The base color of the material, represented as a vector (default is Colors.BLACK).
     */
    color?: Vector3;
    
    /**
     * The metallic factor of the material, from 0 (non-metallic) to 1 (fully metallic) (default is 0).
     */
    metallic?: number;
    
    /**
     * The roughness factor of the material, from 0 (smooth) to 1 (rough) (default is 1).
     */
    roughness?: number;
    
    /**
     * The opacity of the material, from 0 (fully transparent) to 1 (fully opaque) (default is 1).
     */
    opacity?: number;
    
    /**
     * The image to use for the base color texture (optional).
     */
    baseColorImage?: ImageBitmap;
    
    /**
     * The image to use for the metallic-roughness texture (optional).
     */
    metallicRoughnessImage?: ImageBitmap;
    
    /**
     * The image to use for the normal map (optional).
     */
    normalMapImage?: ImageBitmap;
    
    /**
     * The scaling factor for the normal map (optional).
     */
    normalScale?: number;
};

/**
 * A material that defines the properties and textures used in rendering an object.
 * This includes the color, roughness, metallic, opacity, and textures for base color, metallic-roughness, and normal maps.
 */
export class WebaniMaterial {
    /**
     * The base color of the material.
     */
    color: Vector3;

    /**
     * The roughness of the material, where 0 is smooth and 1 is rough.
     */
    roughness: number;

    /**
     * The metallic property of the material, where 0 is non-metallic and 1 is metallic.
     */
    metallic: number;

    /**
     * The opacity of the material, where 0 is fully transparent and 1 is fully opaque.
     */
    opacity: number;

    /**
     * The image used for the base color texture (optional).
     */
    baseColorImage?: ImageBitmap;

    /**
     * The image used for the metallic-roughness texture (optional).
     */
    metallicRoughnessImage?: ImageBitmap;

    /**
     * The image used for the normal map (optional).
     */
    normalMapImage?: ImageBitmap;

    /**
     * The scaling factor for the normal map (optional).
     */
    normalScale?: number;

    /**
     * The WebGL texture for the base color (generated from baseColorImage).
     */
    baseColorTexture: WebGLTexture;

    /**
     * The WebGL texture for the metallic-roughness map (generated from metallicRoughnessImage).
     */
    metallicRoughnessTexture: WebGLTexture;

    /**
     * The WebGL texture for the normal map (generated from normalMapImage).
     */
    normalMap: WebGLTexture;

    /**
     * A set of WebGL contexts to which the material has been bound.
     */
    private boundGLContexts: Set<WebGL2RenderingContext> = new Set<WebGL2RenderingContext>();

    /**
     * Creates a new WebaniMaterial instance with the provided options.
     * @param options The configuration options for the material.
     */
    constructor({
        color = Colors.BLACK,
        metallic = 0,
        roughness = 1,
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

    /**
     * Fills a texture with an image in the provided WebGL context.
     * @param gl The WebGL2 rendering context.
     * @param texture The WebGL texture to update.
     * @param image The image to load into the texture.
     */
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
            image
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Binds the material to a WebGL rendering context.
     * This method will only bind the material to a context if it hasn't been bound before.
     * @param gl The WebGL2 rendering context to bind the material to.
     */
    bindToContext(gl: WebGL2RenderingContext) { 
        if (this.boundGLContexts.has(gl)) {
            return;
        } else {
            this.regenerateTextures(gl);
            this.boundGLContexts.add(gl);
        }
    }

    /**
     * Regenerates the textures for the material based on the images provided.
     * This will delete the existing textures and create new ones.
     * @param gl The WebGL2 rendering context used to regenerate the textures.
     */
    regenerateTextures(gl: WebGL2RenderingContext) {
        if (this.baseColorTexture) {
            gl.deleteTexture(this.baseColorTexture);
        }
        if (this.baseColorImage) { 
            this.baseColorTexture = gl.createTexture();
            this.fillTextureWithImage(gl, this.baseColorTexture, this.baseColorImage);
        }

        if (this.metallicRoughnessTexture) {
            gl.deleteTexture(this.metallicRoughnessTexture);
        }
        if (this.metallicRoughnessImage) { 
            this.metallicRoughnessTexture = gl.createTexture();
            this.fillTextureWithImage(gl, this.metallicRoughnessTexture, this.metallicRoughnessImage);
        }

        if (this.normalMap) {
            gl.deleteTexture(this.normalMap);
        }
        if (this.normalMapImage) { 
            this.normalMap = gl.createTexture();
            this.fillTextureWithImage(gl, this.normalMap, this.normalMapImage);
        }
    }

    /**
     * Creates a shallow copy of the material.
     * This includes copying texture references but not the WebGL contexts the material is bound to.
     * @returns A new WebaniMaterial instance that is a shallow copy of the current material.
     */
    get shallowCopy(): WebaniMaterial {
        const material = new WebaniMaterial({
            color: this.color,
            metallic: this.metallic,
            roughness: this.roughness,
            opacity: this.opacity,
            baseColorImage: this.baseColorImage,
            metallicRoughnessImage: this.metallicRoughnessImage,
            normalMapImage: this.normalMapImage,
            normalScale: this.normalScale
        });

        material.boundGLContexts = this.boundGLContexts;
        material.baseColorTexture = this.baseColorTexture;
        material.metallicRoughnessTexture = this.metallicRoughnessTexture; 
        material.normalMap = this.normalMap;

        return material;
    }
}
