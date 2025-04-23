import { WebaniTransformable } from "../renderer/scene/webani-transformable.class";
import { Matrix4 } from "../types/matrix4.type";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { MatrixUtils } from "../util/matrix.utils";
import { WebaniMesh } from "./webani-mesh.class";

export type WebaniMeshJointOptions = { 
    position?: Vector3,
    rotation?: Vector3; 
    scale?: Vector3;  
    rotationCenter?: Vector3
    inverseBindMatrix: Matrix4,
    extraTransforms?: WorldTransform[];
    parent?: WebaniMeshJoint;
}

export class WebaniMeshJoint extends WebaniTransformable {

    private _inverseBindMatrix: Matrix4;
    parent?: WebaniMeshJoint;

    constructor({
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        inverseBindMatrix,
        extraTransforms,
        parent
    }: WebaniMeshJointOptions) { 
        super({ position, rotation, scale, extraTransforms });
        this._inverseBindMatrix = MatrixUtils.transpose(inverseBindMatrix);
        this.parent = parent;;
    }

    get localCenter() { 
        return [0, 0, 0] as Vector3;
    }

    get center() { 
        return this.transform.position;
    }

    get transformationMatrix() { 
        return MatrixUtils.multiply(this.jointMatrix, this.inverseBindMatrix);
    }

    get inverseBindMatrix() { 
        return this._inverseBindMatrix;
    }

    get jointMatrix(): Matrix4 {
        const transform = this.completeTransform;
        let matrix = MatrixUtils.fromTRS(
            transform.position,
            transform.rotation,
            transform.scale,
            transform.rotationalCenter
        );

        if (this.parent) { 
            matrix = MatrixUtils.multiply(this.parent.jointMatrix, matrix);
        }

        return matrix;
    }
}