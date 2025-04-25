import { Vector3 } from "../../../types/vector3.type";
import { WebaniTransformable } from "../webani-transformable.class";
import { Colors } from "./colors";

export type WebaniLightOptions = {
    position?: Vector3;
    rotation?: Vector3;
    color?: Vector3;
    intensity?: number;
};

export class WebaniPointLight extends WebaniTransformable {

    color: Vector3;
    intensity: number;

    constructor({
        position = [0, 1000, 1500],
        rotation = [0, 0, 0],
        color = Colors.WHITE,
        intensity = 2e+6,
}: WebaniLightOptions = {}) {
        super({
            position,
            rotation,
            scale: [1, 1, 1]
        });
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
