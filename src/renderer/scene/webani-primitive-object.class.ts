import { WebaniInterpolatedAnimation, WebaniInterpolatedAnimationOptions } from "../animation/webani-interpolated-animation.class";
import { Colors } from "../scene/lighting/colors";
import { WebaniMaterial } from "../scene/lighting/webani-material.class";
import { Matrix4 } from "../types/matrix4.type";
import { MatrixUtils } from "../util/matrix.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { WebaniTransformable } from "./webani-transformable.class";

/**
 * Options for constructing a `WebaniPrimitiveObject`.
 * 
 * @property position - The position of the object in 3D space. Default is `[0, 0, 0]`.
 * @property rotation - The rotation of the object as a vector. Default is `[0, 0, 0]`.
 * @property scale - The scale of the object. Default is `[1, 1, 1]`.
 * @property rotationalCenter - The center point around which the object rotates. Default is `undefined`.
 * @property material - The material of the object. Default is a white `WebaniMaterial`.
 * @property extraTransforms - Additional transformations to apply to the object. Default is an empty array.
 */
export type WebaniPrimitiveObjectOptions = {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    rotationalCenter?: Vector3;
    material?: WebaniMaterial;
    extraTransforms?: WorldTransform[];
};

/**
 * The base class for all renderable objects in Webani.
 * This class handles geometry resolution, skinning transformations, and materials for an object.
 */
export abstract class WebaniPrimitiveObject extends WebaniTransformable {

    /**
     * The material applied to this object.
     */
    material: WebaniMaterial;

    /**
     * Triangulation data for the object.
     */
    protected _triangulation!: Float32Array;

    /**
     * Normal vectors for the object's surfaces.
     */
    protected _normals!: Float32Array;

    /**
     * UV coordinates for texture mapping.
     */
    protected _UVs!: Float32Array;

    /**
     * Joint weights for skinning.
     */
    protected _jointWeights!: Float32Array;

    /**
     * Joint indices for skinning.
     */
    protected _jointIndices!: Float32Array;

    /**
     * Matrices representing the object's joints.
     */
    protected _jointObjectMatrices!: Float32Array;

    /**
     * Inverse bind matrices for skinning.
     */
    protected _inverseBindMatrices!: Float32Array;

    /**
     * The center of the object in local space.
     */
    protected _localCenter!: Vector3;

    /**
     * A flag indicating whether skinning transformations should be applied.
     */
    performSkinningTransformation: boolean = false;

    /**
     * Creates an instance of `WebaniPrimitiveObject`.
     * 
     * @param options - Options to customize the object's creation (position, rotation, scale, material, etc).
     */
    constructor({
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        rotationalCenter,
        material = new WebaniMaterial({ color: Colors.WHITE }),
        extraTransforms = [],
    }: WebaniPrimitiveObjectOptions = {}) {
        super({ position, rotation, scale, rotationalCenter, extraTransforms });
        this.material = material;
    }

    /**
     * Abstract method that subclasses must implement to resolve the geometry of the object.
     * This method is responsible for setting up the triangulation and other geometry-related properties.
     */
    abstract resolveObjectGeometry(): void;

    /**
     * Fills the arrays required for the object's geometry (triangulation, normals, UVs, joint weights, etc.).
     * This method ensures that the arrays are allocated with the correct size.
     * 
     * @param vertexCount - The number of vertices in the object.
     * @param jointCount - The number of joints for skinning.
     */
    fillArrays(vertexCount: number = 0, jointCount: number = 0) { 
        if (!this._triangulation || this._triangulation.length < this.vertexCount * 3) {
            this._triangulation = new Float32Array(vertexCount * 3);
        }
        if (!this._normals || this._normals.length < vertexCount * 3) { 
            this._normals = new Float32Array(vertexCount * 3);
        } 
        if (!this._UVs || this._UVs.length < vertexCount * 2) {
            this._UVs = new Float32Array(vertexCount * 2);
        }
        if (!this._jointWeights || this._jointWeights.length < vertexCount * 4) {
            this._jointWeights = new Float32Array(vertexCount * 4);
        }
        if (!this._jointIndices || this._jointIndices.length < vertexCount * 4) {
            this._jointIndices = new Float32Array(vertexCount * 4);
        }
        if (!this._jointObjectMatrices || this._jointObjectMatrices.length < jointCount * 16) {
            this._jointObjectMatrices = new Float32Array(jointCount * 4);
        }
        if (!this._inverseBindMatrices || this._inverseBindMatrices.length < jointCount * 16) {
            this._inverseBindMatrices = new Float32Array(jointCount * 4);
        }
    }

    /**
     * Creates a shallow copy of the object, including a shallow copy of its material.
     * 
     * @returns A new instance of `WebaniPrimitiveObject` with the same properties as the current object.
     */
    get shallowCopy() { 
        const clone = super.shallowCopy; 
        clone.material = clone.material.shallowCopy;
        return clone;
    }

    /**
     * Gets the local center of the object.
     * 
     * @returns The local center as a `Vector3` object.
     */
    get localCenter(): Vector3 { 
        return this._localCenter;
    }

    /**
     * Gets the global center of the object, taking into account the object's transform (position, scale, etc.).
     * 
     * @returns The global center as a `Vector3` object.
     */
    get center(): Vector3 {
        return MatrixUtils.multiplyVector3(
            MatrixUtils.fromTRS(this.transform.position, [0, 0, 0], this.transform.scale),
            this.localCenter
        );
    }

    /**
     * Gets the triangulation data for the object.
     * 
     * @returns The triangulation data as a `Float32Array`.
     */
    get triangles(): Float32Array {
        return this._triangulation;
    }

    /**
     * Gets the normal vectors for the object's surfaces.
     * 
     * @returns The normal vectors as a `Float32Array`.
     */
    get normals(): Float32Array {
        return this._normals;
    }

    /**
     * Gets the UV coordinates for texture mapping.
     * 
     * @returns The UV coordinates as a `Float32Array`.
     */
    get UVs(): Float32Array { 
        return this._UVs;
    }

    /**
     * Gets the joint matrices for skinning.
     * 
     * @returns The joint matrices as a `Float32Array`.
     */
    get jointObjectMatrices(): Float32Array { 
        return this._jointObjectMatrices;
    }

    /**
     * Gets the inverse bind matrices for skinning.
     * 
     * @returns The inverse bind matrices as a `Float32Array`.
     */
    get inverseBindMatrices(): Float32Array { 
        return this._inverseBindMatrices;
    }

    /**
     * Gets the joint indices for skinning.
     * 
     * @returns The joint indices as a `Float32Array`.
     */
    get jointIndices(): Float32Array { 
        return this._jointIndices;
    }

    /**
     * Gets the joint weights for skinning.
     * 
     * @returns The joint weights as a `Float32Array`.
     */
    get weights(): Float32Array  { 
        return this._jointWeights;
    }

    /**
     * Gets the number of vertices in the object.
     * 
     * @returns The vertex count.
     */
    get vertexCount(): number {
        return this._triangulation.length / 3;
    }
}
