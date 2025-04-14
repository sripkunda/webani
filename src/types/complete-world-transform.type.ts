import { Vector3 } from "./vector3.type";
import { WorldTransform } from "./world-transform.type";

export type CompleteWorldTransform = WorldTransform & { rotationCenter: Vector3 };