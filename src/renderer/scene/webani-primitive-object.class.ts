import { WebaniInterpolatedAnimation, WebaniInterpolatedAnimationOptions } from "../animation/webani-interpolated-animation.class";
import { Colors } from "../scene/lighting/colors";
import { WebaniMaterial } from "../scene/lighting/webani-material.class";
import { Matrix4 } from "../types/matrix4.type";
import { MatrixUtils } from "../util/matrix.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { WebaniTransformable } from "./webani-transformable.class";

export type WebaniPrimitiveObjectOptions = {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    rotationalCenter?: Vector3;
    material?: WebaniMaterial;
    extraTransforms?: WorldTransform[];
};

export abstract class WebaniPrimitiveObject extends WebaniTransformable {

    material: WebaniMaterial;
    protected _triangulation!: Float32Array;
    protected _normals!: Float32Array;
    protected _UVs!: Float32Array;
    protected _jointWeights!: Float32Array;
    protected _jointIndices!: Float32Array;
    protected _jointObjectMatrices!: Float32Array;
    protected _inverseBindMatrices!: Float32Array;
    protected _localCenter!: Vector3;
    performSkinningTransformation: boolean = false;

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

    abstract resolveObjectGeometry(): void;

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
    
    get shallowCopy() { 
        const clone = super.shallowCopy; 
        clone.material = clone.material.shallowCopy;
        return clone;
    }

    get localCenter(): Vector3 { 
        return this._localCenter;
    }

    get center(): Vector3 {
        return MatrixUtils.multiplyVector3(
            MatrixUtils.fromTRS(this.transform.position, [0, 0, 0], this.transform.scale),
            this.localCenter
        );
    }

    get triangles(): Float32Array {
        return this._triangulation;
    }

    get normals(): Float32Array {
        return this._normals;
    }

    get UVs(): Float32Array { 
        return this._UVs;
    }

    get jointObjectMatrices(): Float32Array { 
        return this._jointObjectMatrices;
    }

    get inverseBindMatrices(): Float32Array { 
        return this._inverseBindMatrices;
    }

    get jointIndices(): Float32Array { 
        return this._jointIndices;
    }

    get weights(): Float32Array  { 
        return this._jointWeights;
    }

    get vertexCount(): number {
        return this._triangulation.length / 3;
    }
}
