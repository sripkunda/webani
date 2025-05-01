import { WebaniPolygon } from "./webani-polygon.class";
import { windingOrderClockwise } from "../../util/polygon.utils";
import { VectorUtils } from "../../util/vector.utils";
import { Vector3 } from "../../types/vector3.type";
import { WebaniInterpolatedAnimation } from "../../animation/webani-interpolated-animation.class";

/**
 * Options for configuring a `WebaniPolygonAnimation`.
 */
export type WebaniPolygonAnimationOptions = {
    /**
     * The polygon to animate from (the starting state).
     */
    before: WebaniPolygon | null;

    /**
     * The polygon to animate to (the ending state).
     */
    after: WebaniPolygon | null;

    /**
     * The duration of the animation in milliseconds.
     * Optional, default is 1000ms.
     */
    duration?: number;

    /**
     * Whether the animation should play in reverse.
     * Optional, default is false.
     */
    backwards?: boolean;

    /**
     * A custom interpolation function to animate between the `before` and `after` states.
     * Optional, default is `easeInOut`.
     */
    interpolationFunction?: (before: number, after: number, t: number) => number;
};

/**
 * Represents an animated transition between two `WebaniPolygon` objects.
 * It interpolates between polygons, animating their transformation, geometry, and materials.
 */
export class WebaniPolygonAnimation extends WebaniInterpolatedAnimation<WebaniPolygon> {
    
    /**
     * Indicates whether the geometry has changed between the `before` and `after` polygons.
     */
    private geometryChanged!: boolean;

    /**
     * Creates a new instance of `WebaniPolygonAnimation`.
     * @param options The configuration options for the polygon animation.
     */
    constructor({
        before,
        after,
        duration = 1000,
        backwards = false,
        interpolationFunction = WebaniInterpolatedAnimation.easeInOut,
    }: WebaniPolygonAnimationOptions) {
        super({
            before,
            after, 
            duration, 
            backwards, 
            interpolationFunction
        });
    }

    /**
     * Sets the frame of the animation at a given time `t`.
     * @param t The time factor for interpolation (between 0 and 1).
     * @returns A `WebaniPolygon` instance that represents the interpolated polygon at frame `t`.
     */
    setFrame(t: number): WebaniPolygon {
        if (!(this.unresolvedBefore instanceof WebaniPolygon) || !(this.unresolvedAfter instanceof WebaniPolygon)) return this.before;

        this.setTransforms(t);
        this.setMaterial(t);
    
        if (this.geometryChanged) {
            this.currentObject._filledPoints = this.getFilledPoints(t);
            this.currentObject._holes = this.getHoles(t);
            this.currentObject.resolveObjectGeometry();
        }
        return this.currentObject;
    }

    /**
     * Traces a series of points to create a more detailed representation of the polygon's outline.
     * @param points The points to trace.
     * @param numOfPoints The number of points to interpolate between.
     * @returns A list of points that represent the traced outline.
     */
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

    /**
     * Resolves the point arrays for the `before` and `after` polygons to ensure they are compatible.
     * @param beforePointArray The point array of the `before` polygon.
     * @param afterPointArray The point array of the `after` polygon.
     */
    private resolvePointArray(beforePointArray: Vector3[], afterPointArray: Vector3[]) {
        const numOfPoints = Math.max(Math.max(beforePointArray.length, afterPointArray.length) / 3, 100);
        beforePointArray.splice(0, beforePointArray.length, ...this.tracePoints(beforePointArray, numOfPoints));
        afterPointArray.splice(0, afterPointArray.length, ...this.tracePoints(afterPointArray, numOfPoints));

        if (!(windingOrderClockwise(VectorUtils.convertPointsTo2D(afterPointArray)) === windingOrderClockwise(VectorUtils.convertPointsTo2D(beforePointArray)))) { 
            afterPointArray.reverse();
        }
    }

    /**
     * Ensures the `before` and `after` polygons have the same number of holes, filling gaps if necessary.
     * @param beforeHoles The holes in the `before` polygon.
     * @param afterHoles The holes in the `after` polygon.
     * @param beforeReference A reference point from the `before` polygon.
     * @param afterReference A reference point from the `after` polygon.
     */
    private equateHoleCount(beforeHoles: Vector3[][], afterHoles: Vector3[][], beforeReference: Vector3, afterReference: Vector3) {
        const smallToBig = beforeHoles.length < afterHoles.length;
        let i = 0;
        while (beforeHoles.length !== afterHoles.length) {
            const bigger = smallToBig ? afterHoles : beforeHoles;
            const smaller = smallToBig ? beforeHoles : afterHoles;
            const reference = smallToBig ? beforeReference : afterReference;
            smaller.push(new Array(bigger[i].length).fill(0).map(() => reference));
            i++;
        }
    }

    /**
     * Resolves the animation by preparing the polygons and geometry for interpolation.
     */
    resolveAnimation() {
        if (!(this.unresolvedBefore instanceof WebaniPolygon) || !(this.unresolvedAfter instanceof WebaniPolygon)) return;
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
        this.currentObject = this.resolvedBefore.shallowCopy;
        this.geometryChanged = !VectorUtils.arraysEqual(this.resolvedBefore.pointArray, this.resolvedAfter.pointArray);
        if (this.geometryChanged) {
            this.resolvePointArray(this.resolvedBefore._filledPoints, this.resolvedAfter._filledPoints);
            this.equateHoleCount(this.resolvedBefore._holes, this.resolvedAfter._holes, this.resolvedBefore._filledPoints[0], this.resolvedAfter._filledPoints[0]);
            for (const i in this.resolvedBefore._holes) {
                this.resolvePointArray(this.resolvedBefore._holes[i], this.resolvedAfter._holes[i]);
            }
        }
    }

    /**
     * Returns the interpolated filled points between the `before` and `after` polygons at a specific frame `t`.
     * @param t The time factor for interpolation.
     * @returns The interpolated filled points.
     */
    private getFilledPoints(t: number) {
        return this.interpolatePoints(this.resolvedBefore._filledPoints, this.resolvedAfter._filledPoints, t);
    }

    /**
     * Returns the interpolated holes between the `before` and `after` polygons at a specific frame `t`.
     * @param t The time factor for interpolation.
     * @returns The interpolated holes.
     */
    private getHoles(t: number) {
        return this.resolvedBefore._holes.map((beforeHolePoints, i) => {
            return this.interpolatePoints(beforeHolePoints, this.resolvedAfter._holes[i], t);
        });
    }
}
