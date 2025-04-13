import { WebaniPolygonAnimation } from "../animations/webani-polygon-animation.class";
import { WebaniMaterial } from "../lighting/webani-material.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";
import { triangulate } from "../util/polygon.utils";
import { MatrixUtils } from "../util/matrix.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { Webani2DObjectCache as WebaniPolygonCache } from "./webani-polygon-cache.type" 

export class WebaniPolygon extends WebaniPrimitiveObject {

    filledPoints!: Vector3[];
    holes!: Vector3[][];
    opacity!: number;
    rotation!: Vector3;
    _cache!: WebaniPolygonCache;
    material!: WebaniMaterial;
    animationClass = WebaniPolygonAnimation;

    constructor(position: number[], filledPoints: number[][], holes: number[][][] = [], rotation?: Vector3, scale?: Vector3, cache?: WebaniPolygonCache, rotationCenter?: Vector3, material?: WebaniMaterial) {
        super(VectorUtils.convertPointTo3D(position), rotation, scale, rotationCenter, material);
        this.filledPoints = VectorUtils.convertPointsTo3D(filledPoints);
        this.holes = holes.map(holePoints => VectorUtils.convertPointsTo3D(holePoints))
        this._cacheTriangulation(cache?.triangulation, cache?.points);
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
        return new WebaniPolygon(this.position, this.filledPoints, this.holes, this.rotation, this.scale, {
            triangulation: this._cache.triangulation ? [...this._cache.triangulation] : undefined,
            points: [...this._cache.points]
        }, this._rotationCenterOverride, this.material);
    }

    get center() {
        return VectorUtils.center(this.filledPoints);
    }

    get _triangulation() { 
        return this._cachedTriangulationValid(this.pointArray) ? this._cache.triangulation : this._recomputedTriangulation();
    }

    get _normals() { 
        return new Array(this._triangulation.length * 3).fill([0, 0, 1] as Vector3);
    }
    
    _recomputedTriangulation(): Vector3[] {
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
        this._cacheTriangulation(triangulation, points);
        return triangulation;
    }

    _cacheTriangulation(triangulation: Vector3[], points?: Vector3[]) {
        this._cache = {
            points: points ? [...points] : [],
            triangulation: points ? triangulation : undefined
        };
    }

    _cachedTriangulationValid(points: Vector3[]) {
        const cache = this._cache;
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