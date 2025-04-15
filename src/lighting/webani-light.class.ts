import { Colors } from "./colors";
import { Vector3 } from "../types/vector3.type";
import { WebaniTransformable } from "../objects/webani-transformable.class";

export class WebaniLight extends WebaniTransformable {

    color: Vector3;
    intensity: number;

    constructor(
        position: Vector3 = [0, 0, 0],
        rotation: Vector3 = [0, 0, 0],
        color: Vector3 = Colors.WHITE,
        intensity: number = 1,
    ) {
        super(position, rotation, [1, 1, 1]);
        this.color = color;
        this.intensity = intensity;
    }

    get localCenter() {
        return [0, 0, 0] as Vector3;
    }

    get center() { 
        return this.transform.position;
    }
}