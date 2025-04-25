import { WebaniMeshAnimation } from "./webani-mesh-animation.class";
import { Vector3 } from "../../types/vector3.type";
import { WorldTransform } from "../../types/world-transform.type";
import { importGLB } from "../../util/glb.util";
import { VectorUtils } from "../../util/vector.utils";
import { WebaniPrimitiveObject } from "../webani-primitive-object.class";
import { Vector2 } from "../../types/vector2.type";
import { WebaniMeshJoint } from "./webani-mesh-joint.class";
import { AnimationSet } from "../../animation/animation-set.class";
import { Vector4 } from "../../types/vector4.type";
import { MatrixUtils } from "../../util/matrix.utils";
import { WebaniMaterial } from "../lighting/webani-material.class";

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
    private vertexJointIndices?: Vector4[];
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
        this.vertexJointIndices = vertexJoints;
        this.vertexWeights = vertexWeights;
        this.joints = joints;
        this.animations = animations;
        this.resolveObjectGeometry();
        if (this.joints.length > 0) { 
            this.performSkinningTransformation = true;
        }
    }

    resolveObjectGeometry() {
        if (!this._triangulation) {
            this._triangulation = new Float32Array(this.triangleVertices.length * 3);
        }
        if (!this._normals) { 
            this._normals = new Float32Array(this.triangleVertices.length * 3);
        } 
        if (!this._UVs) {
            this._UVs = new Float32Array(this.triangleVertices.length * 2);
        }
        if (!this._jointWeights) {
            this._jointWeights = new Float32Array(this.triangleVertices.length * 4);
        }
        if (!this._jointIndices) {
            this._jointIndices = new Float32Array(this.triangleVertices.length * 4);
        }

        for (let i = 0; i < this.triangleVertices.length; i++) {
            VectorUtils.setFlat(this._normals, 3, i, this.vertexNormals[i]);
            VectorUtils.setFlat(this._triangulation, 3, i, this.triangleVertices[i]);
            if (this.vertexUVs[i]) {
                VectorUtils.setFlat(this._UVs, 2, i, this.vertexUVs[i]);
            }
            if (this.vertexJointIndices[i]) { 
                VectorUtils.setFlat(this._jointIndices, 4, i, this.vertexJointIndices[i]);
            }
            if (this.vertexWeights[i]) { 
                VectorUtils.setFlat(this._jointWeights, 4, i, this.vertexWeights[i]);
            }
        }
        this.resolveJoints();
        this.localCenter = VectorUtils.center(this.triangleVertices);
    }

    resolveJoints() {
        if (!this._jointMatrices) {
            this._jointMatrices = new Float32Array(this.joints.length * 16);
        }
        if (!this._inverseBindMatrices) {
            this._inverseBindMatrices = new Float32Array(this.joints.length * 16);
        }
        for (let i = 0; i < this.joints.length; i++) { 
            VectorUtils.setFlat(this._jointMatrices, 16, i, this.joints[i].jointMatrix);
            VectorUtils.setFlat(this._inverseBindMatrices, 16, i, this.joints[i].inverseBindMatrix);
        }
    }

    get shallowCopy() { 
        const clone = super.shallowCopy as this;
        clone.joints = [...clone.joints.map(joint => joint.shallowCopy)];
        return clone;
    }
 
    static async import(path: string) {
        const model = await importGLB(path);
        const joints: WebaniMeshJoint[] = [];
        const nodeIndices = new Int8Array(model.animationData.skin.inverseBindMatrices.length);
        for (let i = 0; i < model.animationData.skin.inverseBindMatrices.length; i++) { 
            const inverseBindMatrix = model.animationData.skin.inverseBindMatrices[i];
            const joint = model.animationData.nodes[model.animationData.skin.joints[i]];
            nodeIndices[model.animationData.skin.joints[i]] = i;
            if (joint.translation || joint.rotation || joint.scale) {
                const meshJoint = new WebaniMeshJoint({
                    name: joint.name,
                    position: joint.translation,
                    rotation: VectorUtils.quaternionToEulerAngles(joint.rotation),
                    scale: joint.scale,
                    inverseBindMatrix: inverseBindMatrix
                });
                joints[i] = meshJoint;
            }
        }

        for (let i = 0; i < model.animationData.skin.inverseBindMatrices.length; i++) { 
            const joint = model.animationData.nodes[model.animationData.skin.joints[i]];
            for (let j = 0; j < joint.children?.length; j++) {
                const childIndex = joint.children[j];
                joints[nodeIndices[childIndex]].parent = joints[i];
            }
        }

        const animations: AnimationSet[] = [];
        
        for (let i = 0; i < model.animationData.animations.length; i++) { 
            const tracks = model.animationData.animations[i].tracks;
            for (const trackName in tracks) { 
                console.log(tracks[trackName]);
                
            }
        }

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