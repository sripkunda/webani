import { Vector3 } from "../util/vectors/vector3.type";

export class LorentzMaterial {
    ambient: Vector3;
    diffuse: Vector3;
    specular: Vector3;
    shininess: number;
    color: Vector3;
    opacity: number;

    constructor(
        color: Vector3,
        ambient: Vector3 = [0.5, 0.5, 0.5],
        diffuse: Vector3 = [1, 1, 1],
        specular: Vector3 = [1, 1, 1],
        shininess: number = 32,
        opacity = 1
    ) {
        this.color = color;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess;
        this.opacity = opacity;
    }

    static fromColorAndOpacity(color: Vector3, opacity: number = 1) { 
        const material = new LorentzMaterial(color)
        material.opacity = opacity;
        return material;
    }
}