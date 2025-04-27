import { WebaniTransformable } from "../webani-transformable.class";
import { Matrix4 } from "../../types/matrix4.type";
import { Vector3 } from "../../types/vector3.type";
import { WorldTransform } from "../../types/world-transform.type";

export type WebaniMeshJointOptions = { 
    name: string;
    position?: Vector3,
    rotation?: Vector3; 
    scale?: Vector3;  
    rotationCenter?: Vector3
    inverseBindMatrix: Matrix4,
    extraTransforms?: WorldTransform[];
}

export class WebaniMeshJoint extends WebaniTransformable {

    name: string;
    private _inverseBindMatrix: Matrix4;

    constructor({
        name,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        inverseBindMatrix,
        extraTransforms,
    }: WebaniMeshJointOptions) { 
        super({ position, rotation, scale, extraTransforms, useOriginAsCenter: false });
        this.name = name;
        this._inverseBindMatrix = inverseBindMatrix;
    }

    get center() { 
        return [0, 0, 0] as Vector3;
    }

    get inverseBindMatrix() { 
        return this._inverseBindMatrix;
    }
}