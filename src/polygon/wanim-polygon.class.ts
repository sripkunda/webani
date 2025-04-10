import { Colors } from "../lib/colors";
import { WanimMaterial } from "../lighting/wanim-material.class";
import { WanimPrimitiveObject } from "../objects/wanim-primitive-object.class";
import { triangulate } from "../util/geometry/polygon.utils";
import { VectorUtils } from "../util/vectors/vector.utils";
import { Vector3 } from "../util/vectors/vector3.type";
import { Wanim2DObjectCache as WanimPolygonCache } from "./wanim-polygon-cache.type" 

export class WanimPolygonObject extends WanimPrimitiveObject {

    filledPoints!: Vector3[];
    holes!: Vector3[][];
    opacity!: number;
    rotation!: Vector3;
    _cache!: WanimPolygonCache;
    material!: WanimMaterial;

    constructor(position: Vector3, filledPoints: number[][], holes: number[][][], rotation: Vector3 = [0, 0, 0], scale: Vector3, cache?: WanimPolygonCache, rotationCenter?: Vector3, material?: WanimMaterial) {
        super(position, rotation, scale, rotationCenter, material);
        this.filledPoints = VectorUtils.convertPointsTo3D(filledPoints);
        this.holes = holes.map(holePoints => VectorUtils.convertPointsTo3D(holePoints))
        this.rotation = rotation;
        this.rotationalCenter = rotationCenter;
        this.material = material;
        this._cacheTriangulation(cache?.triangulation, cache?.points);
    }

    copyCenteredAt(newCenter: Vector3) {
        newCenter = VectorUtils.convertPointTo3D(newCenter) || newCenter;
        const copy = this.copy;
        const center = this.center;
        copy.filledPoints = copy.filledPoints.map(x => VectorUtils.add(VectorUtils.subtract(x, center), newCenter));
        copy.holes = copy.holes.map(holePoints => holePoints.map(x => VectorUtils.add(VectorUtils.subtract(x, center), newCenter)));
        return copy;
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

    get rotationCenter() {
        return this.rotationalCenter || this.center;
    }

    set rotationCenter(value: Vector3) {
        this.rotationalCenter = value
    }

    get pointArray() { 
        const p = [...this.filledPoints];
        for (const holePoints of this.holes) {
            p.push(...holePoints);
        }
        return p;   
    }

    get copy() {
        return new WanimPolygonObject(this.position, this.filledPoints, this.holes, this.rotation, this.scale, {
            triangulation: [...this._cache.triangulation],
            points: [...this._cache.points]
        }, this.rotationalCenter, this.material);
    }

    get center() {
        return VectorUtils.center(this.filledPoints);
    }

    rotatedCopy(angle: number, center?: Vector3, axis = 2) {
        if (angle % 360 == 0) return this.copy;
        const copy = this.copy;
        if (!center) center = this.center;
        center.splice(axis, 1);
        copy.filledPoints = WanimPolygonObject._computeRotation(copy.filledPoints, angle, center, axis);
        copy.holes = copy.holes.map(p => WanimPolygonObject._computeRotation(p, angle, center, axis));
        return copy;
    }

    static _computeRotation(points: Vector3[], angle: number, center: Vector3 = [0, 0, 0], axis = 2) {
        if (angle % 360 == 0) return points;
        center = VectorUtils.convertPointTo3D(center)
        center.splice(axis, 1);
        return points.map(point => {
            const fixed = point[axis];
            let projectedPoint = point.filter((el, i) => i != axis);
            const x = (projectedPoint[0] - center[0]) * Math.cos(angle * Math.PI / 180) - (projectedPoint[1] - center[1]) * Math.sin(angle * Math.PI / 180) + center[0];
            const y = (projectedPoint[0] - center[0]) * Math.sin(angle * Math.PI / 180) + (projectedPoint[1] - center[1]) * Math.cos(angle * Math.PI / 180) + center[1];
            projectedPoint = [x, y];
            projectedPoint.splice(axis, 0, fixed);
            return projectedPoint;
        }) as Vector3[];
    }

    _triangulation(): Vector3[] {
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

    _dots(points: Vector3[]) {
        return new Float32Array(points.flat());
    }

    static _normalizePoints(points: Float32Array, width: number, height: number) {
        for (let i = 0; i < points.length; i += 3) {
            points[i] = points[i] / width;
            points[i + 1] = points[i + 1] / height;
        }
        return points;
    }
}