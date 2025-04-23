import { WebaniMeshAnimation } from "../animations/webani-mesh-animation.class";
import { WebaniMaterial } from "../renderer/lighting/webani-material.class";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { importGLB } from "../util/glb.util";
import { VectorUtils } from "../util/vector.utils";
import { WebaniPrimitiveObject } from "../renderer/scene/webani-primitive-object.class";
import { Vector2 } from "../types/vector2.type";
import { WebaniMeshJoint } from "./webani-mesh-joint.class";
import { AnimationSet } from "../renderer/animation/animation-set.class";
import { MatrixUtils } from "../util/matrix.utils";
import { Vector4 } from "../types/vector4.type";

export type WebaniMeshOptions = {
    position: Vector3, 
    triangleVertices: Vector3[], 
    vertexNormals: Vector3[], 
    vertexUVs?: Vector2[]
    vertexJoints?: Vector4[],
    vertexWeights?: Vector4[],
    joints?: WebaniMeshJoint[],
    rotation?: Vector3; 
    scale?: Vector3; 
    rotationalCenter?: Vector3, 
    material?: WebaniMaterial, 
    extraTransforms?: WorldTransform[],
    animations?: {
        [key: string]: AnimationSet
    }
};

export class WebaniMesh extends WebaniPrimitiveObject { 
    animationClass = WebaniMeshAnimation;
    private triangleVertices: Vector3[]
    private vertexNormals: Vector3[];
    private vertexUVs?: Vector2[];
    private vertexJoints?: Vector4[];
    private vertexWeights?: Vector4[];
    private joints?: WebaniMeshJoint[];
    animations: {
        [key: string]: AnimationSet
    };

    constructor({
        position, 
        triangleVertices, 
        vertexNormals, 
        vertexUVs,
        vertexJoints,
        vertexWeights,
        joints,
        rotation = [0, 0, 0], 
        scale = [1, 1, 1], 
        rotationalCenter, 
        material, 
        extraTransforms = [],
        animations = {}
    }: WebaniMeshOptions) { 
        super({ 
            position, rotation, scale, rotationalCenter, material, extraTransforms
         });
        this.triangleVertices = triangleVertices;
        this.vertexNormals = vertexNormals;
        this.vertexUVs = vertexUVs;
        this.vertexJoints = vertexJoints;
        this.vertexWeights = vertexWeights;
        this.joints = joints;
        this.animations = animations;
        this.resolveObjectGeometry();
    }

    resolveObjectGeometry() {
        if (!this._triangulation) {
            this._triangulation = new Float32Array(this.triangleVertices.length * 3);
        } 
        if (!this._normals) { 
            this._normals = new Float32Array(this.vertexNormals.length * 3);
        } 
        if (!this._UVs) {
            this._UVs = new Float32Array(this.vertexUVs.length * 2);
        }
        console.log(this.joints);
        for (let i = 0; i < this.triangleVertices.length; i++) {
            if (this.vertexJoints[0] !== undefined) { 
                for (let j = 0; j < 4; j++) {
                    const w = this.vertexWeights[i][j];
                    const T = this.joints[this.vertexJoints[i][j]].transformationMatrix;
                    const normalContribution = MatrixUtils.multiplyVector3(T, VectorUtils.multiply(this.vertexNormals[i], w));
                    const positionContribution = MatrixUtils.multiplyVector3(T, VectorUtils.multiply(this.triangleVertices[i], w));
                    VectorUtils.addFlat(this._normals, 3, i, normalContribution);
                    VectorUtils.addFlat(this._triangulation, 3, i, positionContribution);
                }
            } else {
                VectorUtils.setFlat(this._normals, 3, i, this.vertexNormals[i]);
                VectorUtils.setFlat(this._triangulation, 3, i, this.triangleVertices[i]);
            }
            if (this.vertexUVs[0]) {
                VectorUtils.setFlat(this._UVs, 2, i, this.vertexUVs[i]);
            }
        }
        this.localCenter = VectorUtils.center(this.triangleVertices);
    }
 
    static async import(path: string) {
        const model = await importGLB(path);
        const joints: WebaniMeshJoint[] = model.animationData.skin.inverseBindMatrices.map((inverseBindMatrix, i) => {
            const joint = model.animationData.nodes[i];
            if (joint.translation || joint.rotation || joint.scale) {
                return new WebaniMeshJoint({
                    position: joint.translation,
                    rotation: VectorUtils.quaternionToEulerAngles(joint.rotation),
                    scale: joint.scale,
                    inverseBindMatrix: inverseBindMatrix
                });
            } 
        });

        model.animationData.skin.inverseBindMatrices.forEach((x, i) => {
            const joint = model.animationData.nodes[i];
            if (joint.children) { 
                for (const childIndex in joint.children) { 
                    joints[childIndex].parent = joints[i];
                }
            }
        });

        return new WebaniMesh({
            position: [0, 0, 0],
            triangleVertices: model.vertexData.triangles,
            vertexNormals: model.vertexData.normals,
            vertexUVs: model.vertexData.uvs,
            joints: joints,
            vertexJoints: model.vertexData.joints,
            vertexWeights: model.vertexData.weights,
            material: model.material
        });
    }
}