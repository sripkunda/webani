import { WebaniTransformable } from "../webani-transformable.class";
import { Matrix4 } from "../../types/matrix4.type";
import { Vector3 } from "../../types/vector3.type";
import { WorldTransform } from "../../types/world-transform.type";
import { MatrixUtils } from "../../util/matrix.utils";

export type WebaniMeshJointOptions = { 
    name: string;
    position?: Vector3,
    rotation?: Vector3; 
    scale?: Vector3;  
    rotationCenter?: Vector3
    inverseBindMatrix: Matrix4,
    extraTransforms?: WorldTransform[];
    parent?: WebaniMeshJoint;
}

export class WebaniMeshJoint extends WebaniTransformable {

    name: string;
    private _inverseBindMatrix: Matrix4;
    parent?: WebaniMeshJoint;

    constructor({
        name,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        inverseBindMatrix,
        extraTransforms,
        parent
    }: WebaniMeshJointOptions) { 
        super({ position, rotation, scale, extraTransforms });
        this.name = name;
        this._inverseBindMatrix = inverseBindMatrix;
        this.parent = parent;
    }

    get localCenter() { 
        return [0, 0, 0] as Vector3;
    }

    get center() { 
        return this.transform.position;
    }

    get inverseBindMatrix() { 
        return this._inverseBindMatrix;
    }

    get jointMatrix(): Matrix4 {
        const transform = this.transform;
        let matrix = MatrixUtils.fromTRS(
            transform.position,
            transform.rotation,
            transform.scale,
        );
        
        if (this.parent) { 
            matrix = MatrixUtils.multiply(this.parent.jointMatrix, matrix);
        }

        return matrix;
    }
}