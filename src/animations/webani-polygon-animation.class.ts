import { WebaniMaterial } from "../lighting/webani-material.class";
import { WebaniPolygon } from "../polygon/webani-polygon.class";
import { executeInParallel, windingOrderClockwise } from "../util/polygon.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";

export class WebaniPolygonAnimation extends WebaniInterpolatedAnimation<WebaniPolygon> {
    
    private cache: { time: number; object: WebaniPolygon }[] = [];
    cacheFrames: boolean = false;

    constructor(
        before: WebaniPolygon | null, 
        after: WebaniPolygon | null, 
        duration: number = 1000,
        backwards: boolean = false, 
        cacheFrames: boolean = false,
        interpolationFunction?: (before: number, after: number, t: number) => number
    ) {
        super(before, after, duration, backwards, interpolationFunction);
        this.cacheFrames = cacheFrames;
        this.resolveCache();
    }

    get before(): WebaniPolygon {
        const trueBefore: WebaniPolygon = !this.backwards ? this.unresolvedBefore.copy : this.unresolvedAfter.copy;
        trueBefore.transform.rotation = trueBefore.transform.rotation.map(x => x % 360) as Vector3; 
        return trueBefore;
    }

    get after(): WebaniPolygon {
        const trueAfter: WebaniPolygon = !this.backwards ? this.unresolvedAfter.copy : this.unresolvedBefore.copy;
        trueAfter.transform.rotation = trueAfter.transform.rotation.map(x => x % 360) as Vector3;
        return trueAfter;
    }

    set before(value: WebaniPolygon) { 
        this.unresolvedBefore = value;
        this.resolveAnimation();
    }

    set after(value: WebaniPolygon) { 
        this.unresolvedAfter = value;
        this.resolveAnimation();
    }

    frame(t: number, useCached = this.cacheFrames): WebaniPolygon {
        if (useCached) { 
            const cachedFrame = this.cachedFrame(t);
            if (cachedFrame !== undefined) {
                return cachedFrame;
            }
        }
        if (!(this.unresolvedBefore instanceof WebaniPolygon) || !(this.unresolvedAfter instanceof WebaniPolygon)) return this.before;
        const transform = this.getTransform(t);
        return new WebaniPolygon(transform.position, this.getFilledPoints(t), this.getHoles(t), transform.rotation, transform.scale, this.resolvedBefore.cache, transform.rotationCenter, this.getMaterial(t), this.getExtraTransforms(t));
    }

    private tracePoints(points: Vector3[], numOfPoints: number): Vector3[] { 
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

    private resolvePointArray(beforePointArray: Vector3[], afterPointArray: Vector3[]) {
        const numOfPoints = Math.max(Math.max(beforePointArray.length, afterPointArray.length) / 3, 100);
        beforePointArray.splice(0, beforePointArray.length, ...this.tracePoints(beforePointArray, numOfPoints));
        afterPointArray.splice(0, afterPointArray.length, ...this.tracePoints(afterPointArray, numOfPoints));
        if (!(windingOrderClockwise(VectorUtils.convertPointsTo2D(afterPointArray)) == windingOrderClockwise(VectorUtils.convertPointsTo2D(beforePointArray)))) { 
            afterPointArray.reverse();
        }
    }

    private equateHoleCount(beforeHoles: Vector3[][], afterHoles: Vector3[][], beforeReference: Vector3, afterReference: Vector3) {
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

    private cachedFrame(t: number) {
        if (!this.cache) return;
        const items = this.cache.filter(x => Math.abs(x.time - t) < 50);
        if (items.length > 0) {
            return items[0].object;
        }
    }

    private get cacheStep() {
        return Math.ceil(this.duration / 60);
    }

    private cacheUntilFrame(t: number) {
        while (t > 0) {
            this.cacheTimes(t);
            t -= this.cacheStep;
        }
    }

    private cacheTimes(...times: number[]) {
        if (!this.cache) this.cache = [];
        executeInParallel((t: number) => {
            this.cache.push({
                time: t,
                object: this.frame(t, false)
            });
        }, times);
    }

    private resolveCache() { 
        if (this.cacheFrames) { 
            this.cacheUntilFrame(this.duration);
        }
    }

    resolveAnimation() {
        if (!(this.unresolvedBefore instanceof WebaniPolygon) || !(this.unresolvedAfter instanceof WebaniPolygon)) return;
        this.resolvedBefore = this.unresolvedBefore.copy;
        this.resolvedAfter = this.unresolvedAfter.copy;
        this.resolvePointArray(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints);
        this.equateHoleCount(this.resolvedBefore.holes, this.resolvedAfter.holes, this.resolvedBefore.filledPoints[0], this.resolvedAfter.filledPoints[0]);
        for (const i in this.resolvedBefore.holes) {
            this.resolvePointArray(this.resolvedBefore.holes[i], this.resolvedAfter.holes[i]);
        }
        this.resolvedBefore.recomputeTriangulation();
        this.resolvedAfter.recomputeTriangulation();
    }

    private getFilledPoints(t: number) {
        return this.interpolatePoints(this.resolvedBefore.filledPoints, this.resolvedAfter.filledPoints, t);
    }

    private getHoles(t: number) {
        return this.resolvedBefore.holes.map((beforeHolePoints, i) => {
            return this.interpolatePoints(beforeHolePoints, this.resolvedAfter.holes[i], t);
        });
    }

    private getMaterial(t: number) { 
        const normalizedT = this.backwards ? 1 - t / this.duration : t / this.duration;
        const color = this.interpolatePoint(this.resolvedBefore.material.color, this.resolvedAfter.material.color, t);
        const opacity = this.interpolationFunction(this.resolvedBefore.material.opacity, this.resolvedAfter.material.opacity, normalizedT);
        const metalic = this.interpolationFunction(this.resolvedBefore.material.metalic, this.resolvedAfter.material.metalic, normalizedT);
        const roughness = this.interpolationFunction(this.resolvedBefore.material.roughness, this.resolvedAfter.material.roughness, normalizedT);
        return new WebaniMaterial(color, metalic, roughness, opacity);
    }
}