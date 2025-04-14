import { WebaniTransformable } from "../objects/webani-transformable.class";
import { WorldTransform } from "../types/world-transform.type";
import { Vector3 } from "../types/vector3.type";
import { WebaniAnimation } from "./webani-animation.class";

export abstract class WebaniInterpolatedAnimation<T extends WebaniTransformable> extends WebaniAnimation {
    duration!: number;
    backwards!: boolean;
    protected unresolvedBefore!: T;
    protected unresolvedAfter!: T;
    protected resolvedBefore!: T;
    protected resolvedAfter!: T;
    interpolationFunction: (before: number, after: number, t: number) => number;

    constructor(
        before: T, 
        after: T, 
        duration: number = 1000,
        backwards: boolean = false, 
        interpolationFunction?: (before: number, after: number, t: number) => number
    ) {
        super();
        this.unresolvedBefore = before;
        this.unresolvedAfter = after;
        this.duration = duration;
        this.backwards = backwards;
        this.interpolationFunction = interpolationFunction || WebaniInterpolatedAnimation.easeInOut;
        this.resolveAnimation();
        this.resolveTransforms();
    }

    abstract frame(t: number): T;

    resolveTransforms() { 
        while (this.resolvedAfter.extraTransforms.length != this.resolvedBefore.extraTransforms.length) { 
            const empty: WorldTransform = {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            }
            if (this.resolvedAfter.extraTransforms.length < this.resolvedBefore.extraTransforms.length) { 
                this.resolvedAfter.extraTransforms.push(empty);
            } else { 
                this.resolvedBefore.extraTransforms.push(empty);
            }
        }
    }

    abstract resolveAnimation(): void;

    progress(t: number): number { 
        const normalizedT = t / this.duration;
        return this.interpolationFunction(0, 1, normalizedT);  
    }

    done(t: number): boolean {
        return this.progress(t) >= 1;
    }

    get before(): T { 
        return this.unresolvedBefore;
    }

    get after(): T { 
        return this.unresolvedAfter;
    }

    set before(value: T) { 
        this.unresolvedBefore = value;
        this.resolveAnimation();
    }

    set after(value: T) { 
        this.unresolvedAfter = value;
        this.resolveAnimation();
    }

    protected interpolatePoints(beforePoints: Vector3[], afterPoints: Vector3[], t: number) {
        return beforePoints.map((before, i) => {
            const after = afterPoints[i];
            return this.interpolatePoint(before, after, t);
        }) as Vector3[];
    }

    protected interpolatePoint(before: Vector3, after: Vector3, t: number) { 
        if (t >= this.duration) return this.backwards ? before : after;
        if (t < 0) return before;
        t = this.backwards ? 1 - t / this.duration : t / this.duration;
        return before.map((x, j) => this.interpolationFunction(x, after[j], t)) as Vector3;
    }

    protected getTransform(t: number, beforeTransform: WorldTransform = this.resolvedBefore.completeTransform, afterTransform: WorldTransform = this.resolvedAfter.completeTransform): WorldTransform { 
        const position = this.interpolatePoint(beforeTransform.position, afterTransform.position, t);
        const scale = this.interpolatePoint(beforeTransform.scale, afterTransform.scale, t);
        const rotation = this.interpolatePoint(beforeTransform.rotation, afterTransform.rotation, t);
        const rotationCenter = this.interpolatePoint(beforeTransform?.rotationCenter || afterTransform?.rotationCenter, afterTransform?.rotationCenter || beforeTransform?.rotationCenter, t);
        return {
            position, scale, rotation, rotationCenter
        }
    }

    protected getExtraTransforms(t: number): WorldTransform[] { 
        return this.resolvedBefore.extraTransforms.map((x, i) => this.getTransform(t, x, this.resolvedAfter.extraTransforms[i]));
    }

    static lerp(before: number, after: number, t: number): number {
        return before + t * (after - before);
    }

    static cubic(before: number, after: number, t: number): number {
        return WebaniInterpolatedAnimation.lerp(before, after, Math.pow(t, 3));
    }

    static easeInOut(before: number, after: number, t: number): number {
        return WebaniInterpolatedAnimation.lerp(before, after, 0.5 * (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))));
    }
}