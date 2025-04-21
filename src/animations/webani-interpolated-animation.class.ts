import { WebaniTransformable } from "../objects/webani-transformable.class";
import { WorldTransform } from "../types/world-transform.type";
import { Vector3 } from "../types/vector3.type";
import { WebaniAnimation } from "./webani-animation.class";
import { WebaniMaterial } from "../lighting/webani-material.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";

export interface WebaniInterpolatedAnimationOptions<T extends WebaniTransformable> {
    before: T;
    after: T;
    duration?: number;
    backwards?: boolean;
    interpolationFunction?: (before: number, after: number, t: number) => number;
};

export abstract class WebaniInterpolatedAnimation<T extends WebaniTransformable> extends WebaniAnimation {
    duration!: number;
    backwards!: boolean;
    protected unresolvedBefore!: T;
    protected unresolvedAfter!: T;
    protected resolvedBefore!: T;
    protected resolvedAfter!: T;
    interpolationFunction: (before: number, after: number, t: number) => number;
    
    protected currentObject!: T;

    constructor({
        before,
        after,
        duration = 1000,
        backwards = false,
        interpolationFunction = WebaniInterpolatedAnimation.easeInOut,
    }: WebaniInterpolatedAnimationOptions<T>) {
        super();
        this.unresolvedBefore = before;
        this.unresolvedAfter = after;
        this.duration = duration;
        this.backwards = backwards;
        this.interpolationFunction = interpolationFunction;
        this.resolveAnimation();
        this.resolveTransforms();
    }

    frame(t: number): T { 
        this.setFrame(t);
        return this.currentObject;
    }

    protected abstract setFrame(t: number): T;

    resolveTransforms() {
        while (this.resolvedAfter.extraTransforms.length !== this.resolvedBefore.extraTransforms.length) {
            const empty: WorldTransform = {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            };
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
        const rotationalCenter = this.interpolatePoint(
            beforeTransform?.rotationalCenter || afterTransform?.rotationalCenter,
            afterTransform?.rotationalCenter || beforeTransform?.rotationalCenter,
            t
        );
        return {
            position,
            scale,
            rotation,
            rotationalCenter,
        };
    }

    protected getMaterial(t: number) { 
        if (this.resolvedBefore instanceof WebaniPrimitiveObject && this.resolvedAfter instanceof WebaniPrimitiveObject) {
            const normalizedT = this.backwards ? 1 - t / this.duration : t / this.duration;
            const color = this.interpolatePoint(this.resolvedBefore.material.color, this.resolvedAfter.material.color, t);
            const opacity = this.interpolationFunction(this.resolvedBefore.material.opacity, this.resolvedAfter.material.opacity, normalizedT);
            const metalic = this.interpolationFunction(this.resolvedBefore.material.metallic, this.resolvedAfter.material.metallic, normalizedT);
            const roughness = this.interpolationFunction(this.resolvedBefore.material.roughness, this.resolvedAfter.material.roughness, normalizedT);
            return new WebaniMaterial({
                color, 
                metallic: metalic, 
                roughness, 
                opacity
            });
        } else return new WebaniMaterial({});
    }

    protected getExtraTransforms(t: number): WorldTransform[] {
        return this.resolvedBefore.extraTransforms.map((x, i) =>
            this.getTransform(t, x, this.resolvedAfter.extraTransforms[i])
        );
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
