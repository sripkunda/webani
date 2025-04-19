import { WebaniInterpolatedAnimation } from "../animations/webani-interpolated-animation.class";
import { Colors } from "../lighting/colors";
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
    }

    get copy() { 
        return new WebaniMesh(this.transform.position, this.triangleVertices, this.vertexNormals, this.transform.rotation, this.transform.scale, this.transform.rotationCenter, this.material.copy, this.extraTransforms);
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

    static async import(path: string): Promise<WebaniMesh> {
        const res = await fetch(path);
        const arrayBuffer = await res.arrayBuffer();
        const dataView = new DataView(arrayBuffer);
    
        const magic = new TextDecoder().decode(new Uint8Array(arrayBuffer, 0, 4));
        if (magic !== 'glTF') throw new Error('Not a valid GLB file');
    
        const jsonLength = dataView.getUint32(12, true);
        const jsonStart = 20;
        const jsonChunk = new Uint8Array(arrayBuffer, jsonStart, jsonLength);
        const jsonText = new TextDecoder().decode(jsonChunk);
        const gltf = JSON.parse(jsonText);
    
        const binStart = jsonStart + jsonLength + 8;
        const binaryBuffer = new Uint8Array(arrayBuffer, binStart);
    
        const primitive = gltf.meshes[0].primitives[0];
    
        const extractAttribute = (semantic: string): Vector3[] => {
            const accessorIndex = primitive.attributes[semantic];
            const accessor = gltf.accessors[accessorIndex];
            const bufferView = gltf.bufferViews[accessor.bufferView];
    
            const componentType = accessor.componentType;
            if (componentType !== 5126) throw new Error(`Unsupported component type: ${componentType}`);
    
            const count = accessor.count;
            const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            const array = new Float32Array(binaryBuffer.buffer, byteOffset, count * 3); // VEC3 = 3
    
            const result: Vector3[] = [];
            for (let i = 0; i < count; i++) {
                result.push([array[i * 3], array[i * 3 + 1], array[i * 3 + 2]]);
            }
    
            return result;
        };
    
        const positions = extractAttribute("POSITION");
        const normals = extractAttribute("NORMAL");
    
        return new WebaniMesh([0, 0, 0], positions, normals);
    }
}