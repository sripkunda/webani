import { Vector3 } from "../types/vector3.type";

export class WebaniMaterial {
    color: Vector3;
    roughness: number;
    metalic: number;
    opacity: number;

    constructor(
        color: Vector3,
        metalic: number = 0,
        roughness: number = 0,
        opacity = 1
    ) {
        this.color = color;
        this.metalic = metalic;
        this.roughness = roughness;
        this.opacity = opacity;
    }

    static fromColorAndOpacity(color: Vector3, opacity: number = 1) { 
        const material = new WebaniMaterial(color)
        material.opacity = opacity;
        return material;
    }
}