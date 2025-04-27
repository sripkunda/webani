import { WebaniPolygonAnimation } from "./webani-polygon-animation.class";
import { WebaniPrimitiveObject } from "../webani-primitive-object.class";
import { triangulate } from "../../util/polygon.utils";
import { VectorUtils } from "../../util/vector.utils";
import { Vector3 } from "../../types/vector3.type";
import { WorldTransform } from "../../types/world-transform.type";
import { WebaniMaterial } from "../lighting/webani-material.class";

export type WebaniPolygonOptions = {
    position: number[]; 
    scale?: Vector3;
    rotation?: Vector3;
    filledPoints: number[][];
    holes?: number[][][];
    rotationalCenter?: Vector3;
    material?: WebaniMaterial;
    extraTransforms?: WorldTransform[];
}

export class WebaniPolygon extends WebaniPrimitiveObject {

    _filledPoints!: Vector3[];
    _holes!: Vector3[][];
    animationClass = WebaniPolygonAnimation;

    constructor({
        position, 
        filledPoints,
        holes = [],
        rotation = [0, 0, 0], 
        scale = [1, 1, 1],
        rotationalCenter,
        material,
        extraTransforms = []
    }: WebaniPolygonOptions) {
        super({
            position: VectorUtils.convertPointTo3D(position), 
            rotation, 
            scale, 
            rotationalCenter, 
            material, 
            extraTransforms
        });
        this._filledPoints = VectorUtils.convertPointsTo3D(filledPoints);
        this._holes = holes.map(holePoints => VectorUtils.convertPointsTo3D(holePoints));
        this.resolveObjectGeometry();
    }

    get holeIndices() {
        let sum = this._filledPoints.length;
        const indices: number[] = [];
        for (const hole of this._holes) {
            indices.push(sum);
            sum += hole.length;
        }
        return indices;
    }

    get shallowCopy() {
        const clone = super.shallowCopy;
        clone._filledPoints = [...this._filledPoints];
        clone._holes = [...this._holes];
        return clone;
    }

    get pointArray() { 
        const p = [...this._filledPoints];
        for (const holePoints of this._holes) {
            p.push(...holePoints);
        }
        return p;   
    }

    resolveObjectGeometry() { 
        this._triangulation = this.computeTrianguation();
        this._normals = this.computeNormals();
        this._localCenter = VectorUtils.center(this._filledPoints);
        this.fillArrays(this._triangulation.length / 3, 0);
    }

    computeNormals() {
        const n = this._triangulation.length;
        const arr = new Float32Array(n);
        for (let i = 2; i < n; i += 3) {
            arr[i] = 1;
        }
        return arr;     
    }
    
    computeTrianguation(): Float32Array {
        let triangulation: Float32Array;
        const holeIndices = this.holeIndices;
        const points = this._holes.length > 0 ? this.pointArray : this._filledPoints;
        if (points.length > 3) {
            const triangulated = triangulate(VectorUtils.convertPointsTo2D(points).flat(), holeIndices);
            const triangulatedPoints: Float32Array = new Float32Array(triangulated.length * 3);
            for (let i = 0; i < triangulated.length; i++) {
                let point = points[triangulated[i]];
                triangulatedPoints[3 * i] = point[0];
                triangulatedPoints[3 * i + 1] = point[1];
                triangulatedPoints[3 * i + 2] = point[2];
            }
            triangulation = triangulatedPoints;
        } else {
            triangulation = new Float32Array(points.flat());
        }
        return triangulation;
    }
}