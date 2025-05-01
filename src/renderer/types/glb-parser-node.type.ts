import { Matrix4 } from "./matrix4.type";
import { Vector3 } from "./vector3.type";
import { Vector4 } from "./vector4.type";

export type GLBParserNode = {
    name?: string;
    mesh?: number;
    skin?: number;
    rotation?: Vector4;
    children?: number[];
    matrix?: Matrix4;
    scale?: Vector3;
    translation: Vector3;
    extras: {
        scaleCompensation: string;
    }
};