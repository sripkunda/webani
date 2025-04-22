import { Vector3 } from "../../types/vector3.type";
import { Colors } from "./colors";

export type WebaniMaterialOptions = {
    color?: Vector3;
    metallic?: number;
    roughness?: number;
    opacity?: number;
};

export class WebaniMaterial {
    color: Vector3;
    roughness: number;
    metallic: number;
    opacity: number;
    baseColorTexture?: ImageBitmap;
    metallicRoughnessTexture?: ImageBitmap;
    normalMap?: ImageBitmap;
    normalScale?: number;

    constructor({
        color = Colors.BLACK,
        metallic = 0,
        roughness = 0.02,
        opacity = 1
    }: WebaniMaterialOptions) {
        this.color = color;
        this.metallic = metallic;
        this.roughness = roughness;
        this.opacity = opacity;
    }

    get shallowCopy() {
        return new WebaniMaterial({
            color: this.color,
            metallic: this.metallic,
            roughness: this.roughness,
            opacity: this.opacity
        });
    }
}
