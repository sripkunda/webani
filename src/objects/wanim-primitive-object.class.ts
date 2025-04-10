import { Colors } from "../lib/colors";
import { WanimMaterial } from "../lighting/wanim-material.class";
import { Vector3 } from "../util/vectors/vector3.type";

export abstract class WanimPrimitiveObject { 
    
    position: Vector3;
    rotation!: Vector3;
    scale: Vector3;
    rotationalCenter?: Vector3
    cachedNormals?: Float32Array;
    material!: WanimMaterial;

    constructor(position: Vector3, rotation: Vector3, scale: Vector3, rotationalCenter?: Vector3, material?: WanimMaterial, cachedNormals?: Vector3[]) { 
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.rotationalCenter = rotationalCenter;
        this.material = material || new WanimMaterial(Colors.WHITE);
    }

    abstract _triangulation(): Vector3[];
    abstract get copy(): WanimPrimitiveObject;
    abstract get center(): Vector3;

    get triangles(): Vector3[] { 
        const triangulation = this._triangulation();
        return triangulation;
    }

    recomputeNormals() { 

    }

    get normals(): Float32Array { 
        if (!this.cachedNormals) { 
            this.recomputeNormals();
        }
        return this.cachedNormals;
    }
}