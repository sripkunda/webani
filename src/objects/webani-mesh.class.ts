import { WebaniMeshAnimation } from "../animations/webani-mesh-animation.class";
import { WebaniMaterial } from "../renderer/lighting/webani-material.class";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { importGLB } from "../util/glb.util";
import { VectorUtils } from "../util/vector.utils";
import { WebaniPrimitiveObject } from "../renderer/scene/webani-primitive-object.class";
import { Vector2 } from "../types/vector2.type";

export type WebaniMeshOptions = {
    position: Vector3, 
    triangleVertices: Vector3[], 
    vertexNormals: Vector3[], 
    vertexUVs?: Vector2[]
    rotation?: Vector3; 
    scale?: Vector3; 
    rotationalCenter?: Vector3, 
    material?: WebaniMaterial, 
    extraTransforms?: WorldTransform[],
};

export class WebaniMesh extends WebaniPrimitiveObject { 
    animationClass = WebaniMeshAnimation;
    private triangleVertices: Vector3[]
    private vertexNormals: Vector3[];
    private vertexUVs?: Vector2[];

    constructor({
        position, 
        triangleVertices, 
        vertexNormals, 
        vertexUVs,
        rotation = [0, 0, 0], 
        scale = [1, 1, 1], 
        rotationalCenter, 
        material, 
        extraTransforms = [],
    }: WebaniMeshOptions) { 
        super({ 
            position, rotation, scale, rotationalCenter, material, extraTransforms
         });
        this.triangleVertices = triangleVertices;
        this.vertexNormals = vertexNormals;
        this.vertexUVs = vertexUVs;
        this.resolveObjectGeometry();
    }

    resolveObjectGeometry() {
        this._triangulation = new Float32Array(this.triangleVertices.flat());
        this._normals = new Float32Array(this.vertexNormals.flat());
        if (this.vertexUVs) { 
            this._UVs = new Float32Array(this.vertexUVs.flat());
        } else {
            this._UVs = this.generateDummyUVs();
        }
        this.localCenter = VectorUtils.center(this.triangleVertices);
    }
 
    static async import(path: string) {
        const model = await importGLB(path); 
        return new WebaniMesh({
            position: [0, 0, 0],
            triangleVertices: model.triangles,
            vertexNormals: model.normals,
            vertexUVs: model.uvs,
            material: model.material
        });
    }
}