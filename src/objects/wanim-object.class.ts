import { Colors } from "../lib/colors";
import { pointsInPolygon, triangulate } from "../util/utils";
import { Vector } from "../util/vector.type";
import { WanimObjectCache } from "./wanim-object-cache.type" 

export class WanimObject {

    filledPoints: Vector[];
    holes: Vector[][];
    color: Vector;
    opacity: number;
    rotation: Vector;
    _rotationCenter: Vector | undefined;
    _cache: WanimObjectCache = {};

    constructor(filledPoints: Vector[], holes: Vector[][], color: Vector = Colors.WHITE, opacity: number = 1, rotation: Vector = [0, 0, 0], cache: WanimObjectCache | undefined = undefined, rotationCenter: Vector | undefined = undefined) {
        this.filledPoints = WanimObject._convertPointsTo3D(filledPoints);
        this.holes = holes.map(holePoints => WanimObject._convertPointsTo3D(holePoints))
        this.color = color;
        this.opacity = opacity;
        this.rotation = WanimObject._convertPointTo3D(rotation) || [0, 0, 0];
        this._rotationCenter = rotationCenter ? WanimObject._convertPointTo3D(rotationCenter): undefined;
        this._cacheTriangulation(cache?.triangulation, cache?.points);
    }

    copyCenteredAt(newCenter: Vector) {
        newCenter = WanimObject._convertPointTo3D(newCenter) || newCenter;
        const copy = this.copy;
        const center = this.center;
        copy.filledPoints = copy.filledPoints.map(x => WanimObject._add(WanimObject._subtract(x, center), newCenter));
        copy.holes = copy.holes.map(holePoints => holePoints.map(x => WanimObject._add(WanimObject._subtract(x, center), newCenter)));
        return copy;
    }

    get holeIndices() {
        let sum = this.filledPoints.length;
        let indices: number[] = [];
        for (let hole of this.holes) {
            indices.push(sum);
            sum += hole.length;
        }
        return indices;
    }

    get points() {
        let p = [...this.filledPoints];
        for (let holePoints of this.holes) {
            p.push(...holePoints);
        }
        return p;
    }

    get rotatedPoints() {
        return this._rotatePointArray(this.points);
    }

    get rotatedFilledPoints() {
        return this._rotatePointArray(this.filledPoints);
    }

    get rotationCenter() {
        return this._rotationCenter || this.center;
    }

    set rotationCenter(value) {
        this._rotationCenter = WanimObject._convertPointTo3D(value);
    }

    get copy() {
        return new WanimObject(this.filledPoints, this.holes, this.color, this.opacity, this.rotation, {
            triangulation: this._cachedTriangulation,
            points: this.points
        }, this._rotationCenter);
    }

    get center() {
        return WanimObject._center(this.filledPoints);
    }

    normalizedTriangulation(width: number, height: number) {
        return WanimObject._normalizePoints(this._rotatedTriangulation, width, height);
    }

    rotatedCopy(angle: number, center: Vector, axis = 2) {
        if (angle % 360 == 0) return this.copy;
        let copy = this.copy;
        if (!center) center = this.center;
        center = WanimObject._convertPointTo3D(center) || center;
        center.splice(axis, 1);
        copy.filledPoints = WanimObject._computeRotation(copy.filledPoints, angle, center, axis);
        copy.holes = copy.holes.map(p => WanimObject._computeRotation(p, angle, center, axis));
        return copy;
    }

    get _cachedTriangulation() {
        if (!this._cachedTriangulationValid()) {
            return;
        }
        return this._cache?.triangulation;
    }

    static _computeRotation(points: Vector[], angle: number, center: Vector = [0, 0, 0], axis = 2) {
        if (angle % 360 == 0) return points;
        center = WanimObject._convertPointTo3D(center) || [0, 0, 0];
        center.splice(axis, 1);
        return points.map(point => {
            const fixed = point[axis];
            let projectedPoint = point.filter((el, i) => i != axis);
            const x = (projectedPoint[0] - center[0]) * Math.cos(angle * Math.PI / 180) - (projectedPoint[1] - center[1]) * Math.sin(angle * Math.PI / 180) + center[0];
            const y = (projectedPoint[0] - center[0]) * Math.sin(angle * Math.PI / 180) + (projectedPoint[1] - center[1]) * Math.cos(angle * Math.PI / 180) + center[1];
            projectedPoint = [x, y];
            projectedPoint.splice(axis, 0, fixed);
            return projectedPoint;
        });
    }

    _rotatePointArray(points: Vector[]) {
        for (let i = 0; i < 3; i++) {
            points = WanimObject._computeRotation(points, this.rotation[i], this.rotationCenter, i);
        }
        return points;
    }

    get triangulationPoints() {
        let triangulation = this._triangulation;
        let triangulationPoints: Vector[] = [];
        for (let i in triangulation) {
            if (Number(i) % 3 == 0) {
                triangulationPoints.push([triangulation[i]]);
            } else {
                triangulationPoints[triangulationPoints.length - 1].push(triangulation[i]);
            }
        }
        return triangulationPoints;
    }

    get _rotatedTriangulation() {
        return new Float32Array(this._rotatePointArray(this.triangulationPoints).flat());
    }

    get _triangulation() {
        return this._cachedTriangulation || this._triangulate();
    }

    _triangulate() {
        let triangulation: Float32Array;
        let holeIndices = this.holeIndices;
        let points = holeIndices.length > 0 ? this.points : this.filledPoints;
        if (points.length > 3) {
            let triangulated = triangulate(WanimObject._convertPointsTo2D(points).flat(), holeIndices);
            let triangulatedPoints: Vector[] = [];
            for (let i = 0; i < triangulated.length; i++) {
                triangulatedPoints.push(points[triangulated[i]]);
            }
            triangulation = new Float32Array(triangulatedPoints.flat());
        } else {
            triangulation = new Float32Array(points.flat());
        }
        this._cacheTriangulation(triangulation);
        return triangulation;
    }

    _cacheTriangulation(triangulation: Float32Array, points = this.points) {
        this._cache.points = [...points];
        this._cache.triangulation = triangulation ? triangulation : undefined;
    }

    _cachedTriangulationValid(points = this.points) {
        const cache = this._cache;
        if (!cache.triangulation) {
            return false;
        }
        if (points.length != cache.points?.length) {
            return false;
        }
        for (let i in points) {
            if (!cache.points[i].every((x, j) => x == points[i][j])) {
                return false;
            }
        }
        return true;
    }

    _dots(width: number, height: number) {
        return WanimObject._normalizePoints(new Float32Array(this.rotatedPoints.flat()), width, height);
    }

    static _normalizePoints(points: Float32Array, width: number, height: number) {
        for (let i = 0; i < points.length; i += 3) {
            points[i] = points[i] / width - 1 / 2;
            points[i + 1] = points[i + 1] / height - 1 / 2;
        }
        return points;
    }

    static _center(points: Vector[]) {
        const denominator = (1 / points.length);
        return points.reduce((accumulator, currentValue) =>
            [(accumulator[0] + denominator * currentValue[0]), (accumulator[1] + denominator * currentValue[1]), (accumulator[2] + denominator * currentValue[2])], [0, 0, 0]);
    }

    static _multiply(point: Vector, scalar: number) {
        return point.map(x => x * scalar);
    }

    static _add(a: Vector, b: Vector) {
        return a.map((x, i) => x + b[i]);
    }

    static _norm(a: Vector) {
        return WanimObject._distance(a, a.map(x => 0));
    }

    static _subtract(a: Vector, b: Vector) {
        return WanimObject._add(a, WanimObject._multiply(b, -1));
    }

    static _distance(a: Vector, b: Vector) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
    }

    static _convertPointsTo2D(points: Vector[]) {
        return points?.map(x => x.slice(0, 2));
    }

    static _convertPointsTo3D(points: Vector[]) {
        return points.map(x => {
            if (x.length < 3)
                x.push(0.0);
            return x;
        });
    }

    static _convertPointTo3D(point: Vector): Vector {
        const converted = this._convertPointsTo3D([point]);
        return converted[0];
    }
}