import { Vector3 } from "./vector3.type";
import { Vector4 } from "./vector4.type";

export type GLBParserNode = {
    name?: string;
    mesh?: number;
    skin?: number;
    rotation?: Vector4;
    children?: number[]
    scale?: Vector3;
    translation: Vector3;
};