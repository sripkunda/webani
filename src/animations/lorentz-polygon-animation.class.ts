import { LorentzMaterial } from "../lighting/lorentz-material.class";
import { LorentzPolygon } from "../polygon/lorentz-polygon.class";
import { executeInParallel, windingOrderClockwise } from "../util/geometry/polygon.utils";
import { VectorUtils } from "../util/vectors/vector.utils";
import { Vector3 } from "../util/vectors/vector3.type";
import { LorentzInterpolatedAnimation } from "./lorentz-interpolated-animation.class";

export class LorentzPolygonAnimation extends LorentzInterpolatedAnimation<LorentzPolygon> {
    
    cache: { time: number; object: LorentzPolygon }[] = [];
    cacheFrames: boolean = false;

    constructor(
        before: LorentzPolygon | null, 
        after: LorentzPolygon | null, 
        duration: number = 1000,
        backwards: boolean = false, 
        cacheFrames: boolean = false,
        interpolationFunction?: (before: number, after: number, t: number) => number
    ) {
        super(before, after, duration, backwards, interpolationFunction);
        this.cacheFrames = cacheFrames;
        this._resolveCache();
    }

    get before(): LorentzPolygon {
        const trueBefore: LorentzPolygon = !this.backwards ? this._before.copy : this._after.copy;
        trueBefore.rotation = trueBefore.rotation.map(x => x % 360) as Vector3; 
        return trueBefore;
    }

    get after(): LorentzPolygon {
        const trueAfter: LorentzPolygon = !this.backwards ? this._after.copy : this._before.copy;
        trueAfter.rotation = trueAfter.rotation.map(x => x % 360) as Vector3;
        return trueAfter;
    }

    set before(value: LorentzPolygon) { 
        this._before = value;
        this._resolveAnimation();
    }

    set after(value: LorentzPolygon) { 
        this._after = value;
        this._resolveAnimation();
    }

    frame(t: number, useCached = this.cacheFrames): LorentzPolygon {
        if (useCached) { 
            const cachedFrame = this._cachedFrame(t);
            if (cachedFrame !== undefined) {
                return cachedFrame;
            }
        }
        
        t = t / this.duration;
        if (t <= 0) return this.backwards ? this.after : this.before;
        if (t >= 1) return this.backwards ? this.before : this.after;
        if (!(this._before instanceof LorentzPolygon) || !(this._after instanceof LorentzPolygon)) return this.before;
        const frameObject = new LorentzPolygon(this._getPosition(t), this._getFilledPoints(t), this._getHolePoints(t), this._getRotation(t), this._getScale(t), this.resolvedBefore._cache, this._getRotationalCenter(t), this._getMaterial(t));
        return frameObject;
    }

    _tracePoints(points: Vector3[], numOfPoints: number): Vector3[] { 
        if (!points || points.length < 2) return points;
        points = [...points]; 
        points.push(points[0]);
        
        let distance = 0;
        const mappedPoints = points.map((point, index, arr) => {
            if (index > 0) {
                const prev = arr[index - 1];
                distance += VectorUtils.distance(prev, point);
            }
            return { point, distance };
        });
    
        const totalDistance = mappedPoints[mappedPoints.length - 1].distance;
        const step = totalDistance / (numOfPoints - 1); // Step size for interpolation
        const tracedPoints: Vector3[] = [];
        let currentDistance = 0;
    
        for (let i = 0, j = 0; i < numOfPoints; i++) {
            while (j < mappedPoints.length - 1 && mappedPoints[j + 1].distance < currentDistance) {
                j++;
            }
            if (j === mappedPoints.length - 1) {
                tracedPoints.push(mappedPoints[j].point);
            } else {
                const p1 = mappedPoints[j].point;
                const p2 = mappedPoints[j + 1].point;
                const d1 = mappedPoints[j].distance;
                const d2 = mappedPoints[j + 1].distance;
                if ((d2 - d1) > 0) {
                    const t = (currentDistance - d1) / (d2 - d1);
                    tracedPoints.push([
                        p1[0] + t * (p2[0] - p1[0]),
                        p1[1] + t * (p2[1] - p1[1]),
                        p1[2] + t * (p2[2] - p1[2])
                    ]);
                } else {
                    tracedPoints.push(points[j]);
                }
            }
            currentDistance += step;
        }
        return tracedPoints;
    }

    _resolvePointArray(beforePointArray: Vector3[], afterPointArray: Vector3[]) {
        const numOfPoints = Math.max(Math.max(beforePointArray.length, afterPointArray.length) / 3, 100);
        beforePointArray.splice(0, beforePointArray.length, ...this._tracePoints(beforePointArray, numOfPoints));
        afterPointArray.splice(0, afterPointArray.length, ...this._tracePoints(afterPointArray, numOfPoints));
        if (!(windingOrderClockwise(VectorUtils.convertPointsTo2D(afterPointArray)) == windingOrderClockwise(VectorUtils.convertPointsTo2D(beforePointArray)))) { 
            afterPointArray.reverse();
        }
    }

    _equateHoleCount(beforeHoles: Vector3[][], afterHoles: Vector3[][], beforeReference: Vector3, afterReference: Vector3) {
        const smallToBig = beforeHoles.length < afterHoles.length;
        let i = 0;
        while (beforeHoles.length != afterHoles.length) {
            const bigger = smallToBig ? afterHoles : beforeHoles;
            const smaller = smallToBig ? beforeHoles : afterHoles;
            const reference = smallToBig ? beforeReference : afterReference;
            smaller.push(new Array(bigger[i].length).fill(0).map(() => reference));
            i++;
        }
    }

    _cachedFrame(t: number) {
        if (!this.cache) return;
        const items = this.cache.filter(x => Math.abs(x.time - t) < 50);
        if (items.length > 0) {
            return items[0].object;
        }
    }

    get _cacheStep() {
        return Math.ceil(this.duration / 60);
    }

    _cacheUntilFrame(t: number) {
        while (t > 0) {
            this._cache(t);
            t -= this._cacheStep;
        }
    }

    _cache(...times: number[]) {
        if (!this.cache) this.cache = [];
        executeInParallel((t: number) => {
            this.cache.push({
                time: t,
                object: this.frame(t, false)
            });
        }, times);
    }

    _resolveCache() { 
        if (this.cacheFrames) { 
            this._cacheUntilFrame(this.duration);
        }
    }

    _resolveAnimation() {
        if (!(this._before instanceof LorentzPolygon) || !(this._after instanceof LorentzPolygon)) return;
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
        this._resolvePointArray(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints);
        this._equateHoleCount(this.resolvedBefore.holes, this.resolvedAfter.holes, this.resolvedBefore.filledPoints[0], this.resolvedAfter.filledPoints[0]);
        for (const i in this.resolvedBefore.holes) {
            this._resolvePointArray(this.resolvedBefore.holes[i], this.resolvedAfter.holes[i]);
        }
    }

    _interpolatePoints(beforePoints: Vector3[], afterPoints: Vector3[], t: number) {
        return beforePoints.map((before, i) => {
            const after = afterPoints[i];
            return this._interpolatePoint(before, after, t);
        }) as Vector3[];
    }

    _interpolatePoint(before: Vector3, after: Vector3, t: number) { 
        return before.map((x, j) => this.interpolationFunction(x, after[j], this.backwards ? 1 - t : t)) as Vector3;
    }

    _getPosition(t: number) {
        return this._interpolatePoint(this.resolvedBefore.position, this.resolvedAfter.position, t);
    }

    _getScale(t: number) {
        return this._interpolatePoint(this.resolvedBefore.scale, this.resolvedAfter.scale, t);
    }

    _getFilledPoints(t: number) {
        return this._interpolatePoints(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints, t);
    }

    _getHolePoints(t: number) {
        return this.resolvedBefore.holes.map((beforeHolePoints, i) => {
            return this._interpolatePoints(beforeHolePoints, this.resolvedAfter.holes[i], t);
        });
    }

    _getRotation(t: number) {
        return this._interpolatePoint(this.resolvedBefore.rotation, this.resolvedAfter.rotation, t);
    }

    _getRotationalCenter(t: number) {
        if (!this.resolvedBefore._rotationCenterOverride || this.resolvedAfter._rotationCenterOverride) {
            return this.resolvedBefore._rotationCenterOverride || this.resolvedAfter._rotationCenterOverride;
        }
        return this._interpolatePoint(this.resolvedBefore.rotationCenter, this.resolvedAfter.rotationCenter, t);
    }

    _getMaterial(t: number) { 
        const ambient = this._interpolatePoint(this.resolvedBefore.material.ambient, this.resolvedAfter.material.ambient, t);
        const diffuse = this._interpolatePoint(this.resolvedBefore.material.diffuse, this.resolvedAfter.material.diffuse, t);
        const specular = this._interpolatePoint(this.resolvedBefore.material.specular, this.resolvedAfter.material.specular, t);
        const color = this._interpolatePoint(this.resolvedBefore.material.color, this.resolvedAfter.material.color, t);
        const opacity = this.interpolationFunction(this.resolvedBefore.material.opacity, this.resolvedAfter.material.opacity, this.backwards ? 1 - t : t);
        const shininess = this.interpolationFunction(this.resolvedBefore.material.shininess, this.resolvedAfter.material.shininess, this.backwards ? 1 - t : t);
        return new LorentzMaterial(color, ambient, diffuse, specular, shininess, opacity)
    }
}