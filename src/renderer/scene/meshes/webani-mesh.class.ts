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
import { WebaniMaterial } from "../lighting/webani-material.class";
import { WebaniTransformable } from "../webani-transformable.class";
import { WebaniCollection } from "../collections/webani-collection.class";
import { MatrixUtils } from "../../util/matrix.utils";

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
    private triangleVertices!: Vector3[]
    private vertexNormals!: Vector3[];
    private vertexUVs!: Vector2[];
    private vertexJointIndices!: Vector4[];
    private vertexWeights!: Vector4[];
    private joints!: WebaniMeshJoint[];

    animations!: {
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
        this.vertexUVs = vertexUVs || [];
        this.vertexJointIndices = vertexJoints || [];
        this.vertexWeights = vertexWeights || [];
        this.joints = joints || [];
        this.animations = animations || {};
        this.resolveObjectGeometry();
        if (this.joints.length > 0) {
            this.performSkinningTransformation = true;
        }
    }

    resolveObjectGeometry() {
        this.fillArrays(this.triangleVertices.length, this.joints.length);
        this.updateVertexData();
        this.updateJoints();
        this._localCenter = VectorUtils.center(this.triangleVertices);
    }

    updateVertexData(normals = true, trianglePositions = true, uvs = true, jointIndices = true, weights = true) { 
        for (let i = 0; i < this.triangleVertices.length; i++) {
            if (trianglePositions) { 
                VectorUtils.setFlat(this._triangulation, 3, i, this.triangleVertices[i]);
            }
            if (normals) {
                VectorUtils.setFlat(this._normals, 3, i, this.vertexNormals[i]);
            }
            if (uvs && this.vertexUVs[i]) {
                VectorUtils.setFlat(this._UVs, 2, i, this.vertexUVs[i]);
            }
            if (jointIndices && this.vertexJointIndices[i]) { 
                VectorUtils.setFlat(this._jointIndices, 4, i, this.vertexJointIndices[i]);
            }
            if (weights && this.vertexWeights[i]) { 
                VectorUtils.setFlat(this._jointWeights, 4, i, this.vertexWeights[i]);
            }
        }
    }

    updateJoints(inverseBindMatrices = true, jointObjectMatrices = true) {
        for (let i = 0; i < this.joints.length; i++) {
            if (jointObjectMatrices) {
                VectorUtils.setFlat(this._jointObjectMatrices, 16, i, this.joints[i].modelMatrix);
            } 
            if (inverseBindMatrices) { 
                VectorUtils.setFlat(this._inverseBindMatrices, 16, i, this.joints[i].inverseBindMatrix);
            }
        }
    }

    get shallowCopy() { 
        const clone = super.shallowCopy as this;
        clone.joints = [...clone.joints.map(joint => joint.shallowCopy)];
        return clone;
    }
 
    static async import(path: string): Promise<WebaniCollection<WebaniMesh>> {
        const result = await importGLB(path);
        const meshes = result.meshes.map(meshData => new WebaniMesh({
            position: [0, 0, 0],
            triangleVertices: meshData.vertexData.triangles,
            vertexNormals: meshData.vertexData.normals,
            vertexUVs: meshData.vertexData.uvs,
            vertexJoints: meshData.vertexData.joints,
            vertexWeights: meshData.vertexData.weights,
            material: meshData.material
        }));

        const nodes: WebaniTransformable[] = new Array<WebaniTransformable>(result.animationData.nodes.length);
        const joints: WebaniMeshJoint[] = new Array<WebaniMeshJoint>(result.animationData.skin.inverseBindMatrices.length);
        for (let i = 0; i < result.animationData.nodes.length; i++) {
            const jointIndex = result.animationData.skin.joints.indexOf(i);
            let position: Vector3 = [0, 0, 0];
            let rotation: Vector3 = [0, 0, 0];
            let scale: Vector3 = [1, 1, 1];
            const node = result.animationData.nodes[i];
            let nodeObject: WebaniTransformable;
            if (node.matrix) { 
                const transform = MatrixUtils.matrixToTransformColumnMajor(node.matrix); 
                position = transform.position;
                rotation = transform.rotation;
                scale = transform.scale;
            } else {
                position = node.translation ?? position;
                rotation = node.rotation ? VectorUtils.quaternionToEulerAngles(node.rotation) : rotation;
                scale = node.scale ?? scale;
            }
            if (jointIndex > -1) {
                const inverseBindMatrix = result.animationData.skin.inverseBindMatrices[jointIndex];
                nodeObject = new WebaniMeshJoint({
                    name: node.name,
                    position,
                    rotation,
                    scale,
                    inverseBindMatrix: inverseBindMatrix
                });
                joints[jointIndex] = nodeObject as WebaniMeshJoint;
            } else if (node.mesh !== undefined) {
                nodeObject = meshes[node.mesh];
            } else { 
                nodeObject = new WebaniTransformable({
                    position,
                    rotation,
                    scale,
                });
            }
            if (node.extras?.scaleCompensation == "scaleCompensation") { 
                nodeObject.scaleCompensation = true;
            }
            nodes[i] = nodeObject;
        }

        for (let i = 0; i < result.animationData.nodes.length; i++) { 
            const node = result.animationData.nodes[i];
            for (let j = 0; j < node.children?.length; j++) {
                const childIndex = node.children[j];
                nodes[childIndex].parent = nodes[i];
            }
        }
        
        return new WebaniCollection(meshes);
    }
}