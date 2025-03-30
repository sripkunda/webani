import { WanimObject } from "../objects/wanim-object.class";
import { executeInParallel, windingOrderClockwise } from "../util/utils";
import { Vector } from "../util/vector.type";
import { WanimInterpolatedAnimationBase } from "./wanim-interpolated-animation-base.class";

export class WanimObjectAnimation extends WanimInterpolatedAnimationBase<WanimObject> {
    
    cache: { time: number; object: WanimObject }[] = [];
    cacheFrames: boolean = false;
    resolvedBefore: WanimObject;
    resolvedAfter: WanimObject;

    constructor(
        before: WanimObject | null, 
        after: WanimObject | null, 
        duration: number = 1000,
        backwards: boolean = false, 
        cacheFrames: boolean = false,
        interpolationFunction?: (before: number, after: number, t: number) => number
    ) {
        super(before, after, duration, backwards, interpolationFunction);
        this.cacheFrames = cacheFrames;
        this._resolveCache();
    }

    get before(): WanimObject {
        const trueBefore: WanimObject = !this.backwards ? this._before.copy : this._after.copy;
        trueBefore.rotation = trueBefore.rotation.map(x => x %= 360); 
        return trueBefore;
    }

    get after(): WanimObject {
        const trueAfter: WanimObject = !this.backwards ? this._after.copy : this._before.copy;
        trueAfter.rotation = trueAfter.rotation.map(x => x % 360);
        return trueAfter;
    }

    set before(value: WanimObject) { 
        this._before = value;
        this._resolveAnimation();
    }

    set after(value: WanimObject) { 
        this._after = value;
        this._resolveAnimation();
    }

    frame(t: number, useCached = this.cacheFrames): WanimObject {
        if (useCached) { 
            const cachedFrame = this._cachedFrame(t);
            if (cachedFrame !== undefined) {
                return cachedFrame;
            }
        }
        
        // Scale by the duration
        t = t / this.duration;
        if (t <= 0) return this.backwards ? this.after : this.before;
        if (t >= 1) return this.backwards ? this.before : this.after;
        if (!(this._before instanceof WanimObject) || !(this._after instanceof WanimObject)) return this.before;
        const frameObject = new WanimObject(this._getFilledPoints(t), this._getHolePoints(t), this._getColor(t), this._getOpacity(t), this._getRotation(t), this.resolvedBefore._cache, this._getRotationalCenter(t));
        frameObject._triangulate(); // Triangulate in advance to account for cached frames
        return frameObject;
    }

    _tracePoints(points: Vector[], numOfPoints: number): Vector[] { 
        if (!points || points.length < 2) return points;
        points = [...points]; 
        points.push(points[0]);
        
        let distance = 0;
        const mappedPoints = points.map((point, index, arr) => {
            if (index > 0) {
                const prev = arr[index - 1];
                distance += WanimObject._distance(prev, point);
            }
            return { point, distance };
        });
    
        const totalDistance = mappedPoints[mappedPoints.length - 1].distance;
        const step = totalDistance / (numOfPoints - 1); // Step size for interpolation
        const tracedPoints: Vector[] = [];
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

    _resolvePointArray(beforePointArray: Vector[], afterPointArray: Vector[]) {
        const numOfPoints = Math.max(Math.max(beforePointArray.length, afterPointArray.length) / 3, 100);
        beforePointArray.splice(0, beforePointArray.length, ...this._tracePoints(beforePointArray, numOfPoints));
        afterPointArray.splice(0, afterPointArray.length, ...this._tracePoints(afterPointArray, numOfPoints));
        if (!(windingOrderClockwise(afterPointArray) == windingOrderClockwise(beforePointArray))) { 
            afterPointArray.reverse();
        }
    }

    _equateHoleCount(beforeHoles: Vector[][], afterHoles: Vector[][], beforeReference: Vector, afterReference: Vector) {
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
        if (!(this._before instanceof WanimObject) || !(this._after instanceof WanimObject)) return;
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
        this._resolvePointArray(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints);
        this._equateHoleCount(this.resolvedBefore.holes, this.resolvedAfter.holes, this.resolvedBefore.filledPoints[0], this.resolvedAfter.filledPoints[0]);
        for (const i in this.resolvedBefore.holes) {
            this._resolvePointArray(this.resolvedBefore.holes[i], this.resolvedAfter.holes[i]);
        }
        this.resolvedBefore._triangulate();
        this.resolvedAfter._triangulate();
    }

    _interpolatePoints(beforePoints: Vector[], afterPoints: Vector[], t: number) {
        return beforePoints.map((before, i) => {
            const after = afterPoints[i];
            return before.map((x, j) => this.interpolationFunction(x, after[j], this.backwards ? 1 - t : t));
        });
    }

    _getFilledPoints(t: number) {
        return this._interpolatePoints(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints, t);
    }

    _getHolePoints(t: number) {
        return this.resolvedBefore.holes.map((beforeHolePoints, i) => {
            return this._interpolatePoints(beforeHolePoints, this.resolvedAfter.holes[i], t);
        });
    }

    _getColor(t: number) {
        return this.resolvedBefore.color.map((before, i) => {
            const after = this.resolvedAfter.color[i];
            return this.interpolationFunction(before, after, this.backwards ? 1 - t : t);
        });
    }

    _getRotation(t: number) {
        return this.resolvedBefore.rotation.map((before, i) => {
            const after = this.resolvedAfter.rotation[i];
            return this.interpolationFunction(before, after, this.backwards ? 1 - t : t);
        });
    }

    _getRotationalCenter(t: number) {
        return this.resolvedBefore.rotationCenter.map((before, i) => {
            const after = this.resolvedAfter.rotationCenter[i];
            return this.interpolationFunction(before, after, this.backwards ? 1 - t : t);
        });
    }

    _getOpacity(t: number) {
        return this.interpolationFunction(this.resolvedBefore.opacity, this.resolvedAfter.opacity, this.backwards ? 1 - t : t);
    }
}