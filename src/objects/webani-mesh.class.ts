import { WebaniMeshAnimation } from "../animations/webani-mesh-animation.class";
import { WebaniMaterial } from "../lighting/webani-material.class";
import { Vector2 } from "../types/vector2.type";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { importGLB } from "../util/glb.util";
import { VectorUtils } from "../util/vector.utils";
import { WebaniPrimitiveObject } from "./webani-primitive-object.class";

export type WebaniMeshOptions = {
    position: Vector3, 
    triangleVertices: Vector3[], 
    vertexNormals: Vector3[], 
    rotation?: Vector3; 
    scale?: Vector3; 
    rotationalCenter?: Vector3, 
    material?: WebaniMaterial, 
    extraTransforms?: WorldTransform[],
    vertexUV?: Vector2[]
};

export class WebaniMesh extends WebaniPrimitiveObject { 
    animationClass = WebaniMeshAnimation;
    private triangleVertices: Vector3[]
    private vertexNormals: Vector3[];
    private vertexUV: Vector2[];

    constructor({
        position, 
        triangleVertices, 
        vertexNormals, 
        vertexUV,
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
        this.vertexUV = vertexUV;
        this.resolveObjectGeometry();
    }

    get copy() { 
        return new WebaniMesh({
            position: this.transform.position, 
            triangleVertices: this.triangleVertices, 
            vertexNormals: this.vertexNormals, 
            rotation: this.transform.rotation, 
            scale: this.transform.scale, 
            rotationalCenter: this.transform.rotationalCenter, 
            material: this.material.copy, 
            extraTransforms: [...this.extraTransforms],
            vertexUV: this.vertexUV
        });
    }

    resolveObjectGeometry() {
        this._triangulation = new Float32Array(this.triangleVertices.flat());
        this._normals = new Float32Array(this.vertexNormals.flat());
        this.localCenter = VectorUtils.center(this.triangleVertices);
    }
 
    static async import(path: string) {
        const model = await importGLB(path); 
        return new WebaniMesh({
            position: [0, 0, 0],
            triangleVertices: model.triangles,
            vertexNormals: model.normals,
        });
    }
}