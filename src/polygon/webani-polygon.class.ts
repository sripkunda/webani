import { WebaniPolygonAnimation } from "../animations/webani-polygon-animation.class";
import { WebaniMaterial } from "../lighting/webani-material.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";
import { triangulate } from "../util/polygon.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { Webani2DObjectCache as WebaniPolygonCache } from "./webani-polygon-cache.type" 
import { WorldTransform } from "../types/world-transform.type";

export class WebaniPolygon extends WebaniPrimitiveObject {

    filledPoints!: Vector3[];
    holes!: Vector3[][];
    cache!: WebaniPolygonCache;
    animationClass = WebaniPolygonAnimation;

    constructor(position: number[], filledPoints: number[][], holes: number[][][] = [], rotation?: Vector3, scale?: Vector3, cache?: WebaniPolygonCache, rotationCenter?: Vector3, material?: WebaniMaterial, extraTransforms: WorldTransform[] = []) {
        super(VectorUtils.convertPointTo3D(position), rotation, scale, rotationCenter, material, extraTransforms);
        this.filledPoints = VectorUtils.convertPointsTo3D(filledPoints);
        this.holes = holes.map(holePoints => VectorUtils.convertPointsTo3D(holePoints));
        this.cacheTriangulation(cache?.triangulation, cache?.points);
    }

    get holeIndices() {
        let sum = this.filledPoints.length;
        const indices: number[] = [];
        for (const hole of this.holes) {
            indices.push(sum);
            sum += hole.length;
        }
        return indices;
    }

    get pointArray() { 
        const p = [...this.filledPoints];
        for (const holePoints of this.holes) {
            p.push(...holePoints);
        }
        return p;   
    }

    get copy() {
        const copiedMaterial = new WebaniMaterial(this.material.color, this.material.ambient, this.material.diffuse, this.material.specular, this.material.shininess, this.material.opacity);
        const copiedTransforms = [...this.extraTransforms];
        const copiedCache = {
            triangulation: this.cache.triangulation ? [...this.cache.triangulation] : undefined,
            points: [...this.cache.points]
        };
        return new WebaniPolygon(this.transform.position, this.filledPoints, this.holes, this.transform.rotation, this.transform.scale, copiedCache, this.transform.rotationCenter, copiedMaterial, copiedTransforms);
    }

    get localCenter() {
        return VectorUtils.center(this.filledPoints);
    }

    get _triangulation() { 
        const triangulationValid = this.isCachedTriangulationValid(this.pointArray);
        return triangulationValid ? this.cache.triangulation : this.recomputeTriangulation();
    }

    get _normals() { 
        return new Array(this._triangulation.length * 3).fill([0, 0, 1] as Vector3);
    }
    
    recomputeTriangulation(): Vector3[] {
        let triangulation: Vector3[] = [];
        const holeIndices = this.holeIndices;
        const points = this.holes.length > 0 ? this.pointArray : this.filledPoints;
        if (points.length > 3) {
            const triangulated = triangulate(VectorUtils.convertPointsTo2D(points).flat(), holeIndices);
            const triangulatedPoints: Vector3[] = [];
            for (let i = 0; i < triangulated.length; i++) {
                triangulatedPoints.push(points[triangulated[i]]);
            }
            triangulation = triangulatedPoints;
        } else {
            triangulation = points
        }
        this.cacheTriangulation(triangulation, points);
        return triangulation;
    }

    private cacheTriangulation(triangulation: Vector3[], points?: Vector3[]) {
        this.cache = {
            points: points ? [...points] : [],
            triangulation: points ? triangulation : undefined
        };
    }

    private isCachedTriangulationValid(points: Vector3[]) {
        const cache = this.cache;
        if (!cache.triangulation) {
            return false;
        }
        if (points.length != cache.points.length) {
            return false;
        }
        for (const i in points) {
            if (!cache.points[i].every((x, j) => x == points[i][j])) {
                return false;
            }
        }
        return true;
    }
}