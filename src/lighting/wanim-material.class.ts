import { Vector3 } from "../util/vectors/vector3.type";

export class WanimMaterial {
    ambient: Vector3;
    diffuse: Vector3;
    specular: Vector3;
    shininess: number;
    color: Vector3;
    opacity: number;

    constructor(
        color: Vector3,
        ambient: Vector3 = [0.1, 0.1, 0.1],
        diffuse: Vector3 = [0.8, 0.8, 0.8],
        specular: Vector3 = [1.0, 1.0, 1.0],
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
}