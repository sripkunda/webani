import { Vector3 } from "./vector3.type";

export type WorldTransform = {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    rotationalCenter?: Vector3
}