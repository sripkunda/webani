import { WebaniInterpolatedAnimation } from "../animations/webani-interpolated-animation.class";
import { WebaniMaterial } from "../lighting/webani-material.class";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { VectorUtils } from "../util/vector.utils";
import { WebaniPrimitiveObject } from "./webani-primitive-object.class";

export class WebaniMesh extends WebaniPrimitiveObject { 
    animationClass = undefined;
    triangleVertices!: Vector3[];
    vertexNormals!: Vector3[];
    material: WebaniMaterial;

    constructor(position: Vector3, triangleVertices: Vector3[], vertexNormals: Vector3[], rotation: Vector3 = [0, 0, 0], scale: Vector3 = [1, 1, 1], rotationCenter?: Vector3, material?: WebaniMaterial, extraTransforms: WorldTransform[] = []) { 
        super(position, rotation, scale, rotationCenter, material, extraTransforms);
        this.triangleVertices = triangleVertices;
        this.vertexNormals = vertexNormals;
        this.material = material;
    }

    get copy() { 
        return new WebaniMesh(this.transform.position, this.triangleVertices, this.vertexNormals, this.transform.rotation, this.transform.scale, this.transform.rotationCenter, this.material, this.extraTransforms);
    }

    get localCenter() { 
        return VectorUtils.center(this.triangleVertices);
    }

    get _triangulation(): Vector3[] {
        return this.triangleVertices;
    }

    get _normals(): Vector3[] { 
        return this.vertexNormals;
    }
}