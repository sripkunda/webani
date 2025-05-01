import { WebaniTransformable } from "../webani-transformable.class";
import { Matrix4 } from "../../types/matrix4.type";
import { Vector3 } from "../../types/vector3.type";
import { WorldTransform } from "../../types/world-transform.type";

/**
 * Options for initializing a WebaniMeshJoint object.
 */
export type WebaniMeshJointOptions = { 
    /**
     * The name of the mesh joint.
     */
    name: string;

    /**
     * The position of the mesh joint in 3D space, represented as a `Vector3`.
     * Optional property, default is [0, 0, 0].
     */
    position?: Vector3;

    /**
     * The rotation of the mesh joint, represented as a `Vector3`.
     * Optional property, default is [0, 0, 0].
     */
    rotation?: Vector3;

    /**
     * The scale of the mesh joint, represented as a `Vector3`.
     * Optional property, default is [1, 1, 1].
     */
    scale?: Vector3;  

    /**
     * The rotational center of the mesh joint, represented as a `Vector3`.
     * Optional property.
     */
    rotationCenter?: Vector3;

    /**
     * The inverse bind matrix for the mesh joint, represented as a `Matrix4`.
     */
    inverseBindMatrix: Matrix4;

    /**
     * Additional transforms applied to the mesh joint.
     * Optional property.
     */
    extraTransforms?: WorldTransform[];
};

/**
 * Represents a mesh joint for some `WebaniMesh`. This class extends `WebaniTransformable` and 
 * provides support for mesh joint transformations, including inverse bind matrices used for skinning.
 */
export class WebaniMeshJoint extends WebaniTransformable {

    /**
     * The name of the mesh joint.
     */
    name: string;

    /**
     * The inverse bind matrix for the mesh joint.
     */
    private _inverseBindMatrix: Matrix4;

    /**
     * Creates a new WebaniMeshJoint instance with the provided options.
     * @param options The configuration options for the mesh joint.
     */
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

    /**
     * Returns the center of the joint in 3D space, which is fixed at [0, 0, 0] for mesh joints.
     * @returns The center of the joint as a `Vector3`.
     */
    get center() { 
        return [0, 0, 0] as Vector3;
    }

    /**
     * Returns the inverse bind matrix for the mesh joint.
     * @returns The inverse bind matrix as a `Matrix4`.
     */
    get inverseBindMatrix() { 
        return this._inverseBindMatrix;
    }
}
