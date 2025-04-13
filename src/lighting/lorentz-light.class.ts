import { Colors } from "../api/colors";
import { Vector3 } from "../util/vectors/vector3.type";

export class LorentzLight {
    color: Vector3;
    intensity: number;
    position: Vector3;
    rotation: Vector3;

    constructor(
        position: Vector3 = [0, 0, 5],
        rotation: Vector3 = [0, 0, 0],
        color: Vector3 = Colors.WHITE,
        intensity: number = 1,
    ) {
        this.color = color;
        this.intensity = intensity;
        this.position = position;
        this.rotation = rotation;
    }
}