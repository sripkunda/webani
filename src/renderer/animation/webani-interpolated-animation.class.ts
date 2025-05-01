import { WebaniTransformable } from "../scene/webani-transformable.class";
import { WorldTransform } from "../types/world-transform.type";
import { Vector3 } from "../types/vector3.type";
import { WebaniAnimation } from "./webani-animation.class";
import { WebaniPrimitiveObject } from "../scene/webani-primitive-object.class";
import { CompleteWorldTransform } from "../types/complete-world-transform.type";

/**
 * Options for configuring a `WebaniInterpolatedAnimation` between two `WebaniTransformable` objects.
 */
export interface WebaniInterpolatedAnimationOptions<T extends WebaniTransformable> {
    /** The initial state of the object before animation. */
    before: T;
    
    /** The final state of the object after animation. */
    after: T;
    
    /** Duration of the animation in milliseconds. Default is 1000 ms. */
    duration?: number;
    
    /** Flag indicating if the animation should run backwards. Default is false. */
    backwards?: boolean;
    
    /** Custom interpolation function for animation. Default is ease-in-out. */
    interpolationFunction?: (before: number, after: number, t: number) => number;
}

/**
 * A class that represents an interpolated animation between two `WebaniTransformable` objects.
 * The animation smoothly transitions from a `before` state to an `after` state.
 * Subclasses must implement the `setFrame` and `resolveAnimation` methods.
 */
export abstract class WebaniInterpolatedAnimation<T extends WebaniTransformable> extends WebaniAnimation {
    /** Duration of the animation in milliseconds. */
    duration!: number;
    
    /** Whether the animation plays in reverse. */
    backwards!: boolean;
    
    /** The unresolved before state of the object. */
    protected unresolvedBefore!: T;
    
    /** The unresolved after state of the object. */
    protected unresolvedAfter!: T;
    
    /** The resolved before state of the object. */
    protected resolvedBefore!: T;
    
    /** The resolved after state of the object. */
    protected resolvedAfter!: T;
    
    /** The interpolation function used for the animation. */
    interpolationFunction: (before: number, after: number, t: number) => number;
    
    /** The object being animated. */
    protected currentObject!: T;

    /**
     * Creates an instance of `WebaniInterpolatedAnimation`.
     * 
     * @param options - Configuration options for the animation.
     */
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

    /**
     * Calculates and returns the transformed object at the current frame of the animation.
     * 
     * @param t - The time or progress of the animation, typically between 0 and 1.
     * @returns The current state of the animated object.
     */
    frame(t: number): T { 
        this.setFrame(t);
        return this.currentObject;
    }

    /**
     * Sets the frame at the current time `t` for the animation.
     * 
     * @param t - The time or progress of the animation, typically between 0 and 1.
     * @protected
     */
    protected abstract setFrame(t: number): T;

    /**
     * Resolves the transforms of the `before` and `after` objects to ensure they have the same number of extra transforms.
     * This function ensures that the animation has a consistent structure when resolving the transforms.
     */
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

    /**
     * Resolves the animation-specific state.
     * This is where the specifics of the interpolation or transformation logic are defined.
     * This method must be implemented by subclasses.
     */
    abstract resolveAnimation(): void;

    /**
     * Interpolates the progress of the animation based on the time `t`.
     * 
     * @param t - The time or progress of the animation, typically between 0 and 1.
     * @returns A normalized value between 0 and 1 representing the progress of the animation.
     */
    progress(t: number): number {
        const normalizedT = t / this.duration;
        return this.interpolationFunction(0, 1, normalizedT);
    }

    /**
     * Determines whether the animation is complete based on the current time `t`.
     * 
     * @param t - The time or progress of the animation.
     * @returns `true` if the animation is complete, `false` otherwise.
     */
    done(t: number): boolean {
        return this.progress(t) >= 1;
    }

    /** Getter for the unresolved `before` state of the object. */
    get before(): T {
        return this.unresolvedBefore;
    }

    /** Setter for the unresolved `before` state of the object. */
    set before(value: T) {
        this.unresolvedBefore = value;
        this.resolveAnimation();
    }

    /** Getter for the unresolved `after` state of the object. */
    get after(): T {
        return this.unresolvedAfter;
    }

    /** Setter for the unresolved `after` state of the object. */
    set after(value: T) {
        this.unresolvedAfter = value;
        this.resolveAnimation();
    }

    /**
     * Interpolates between two sets of points over time.
     * 
     * @param beforePoints - The points at the start of the animation.
     * @param afterPoints - The points at the end of the animation.
     * @param t - The time or progress of the animation, typically between 0 and 1.
     * @returns The interpolated points.
     */
    protected interpolatePoints(beforePoints: Vector3[], afterPoints: Vector3[], t: number) {
        return beforePoints.map((before, i) => {
            const after = afterPoints[i];
            return this.interpolatePoint(before, after, t);
        }) as Vector3[];
    }

    /**
     * Interpolates between two points over time.
     * 
     * @param before - The starting point.
     * @param after - The ending point.
     * @param t - The time or progress of the animation.
     * @returns The interpolated point.
     */
    protected interpolatePoint(before: Vector3, after: Vector3, t: number) {
        if (t >= this.duration) return this.backwards ? before : after;
        if (t < 0) return before;
        t = this.backwards ? 1 - t / this.duration : t / this.duration;
        return before.map((x, j) => this.interpolationFunction(x, after[j], t)) as Vector3;
    }

    /**
     * Retrieves the transform of the object at a given time `t`.
     * 
     * @param t - The time or progress of the animation.
     * @param beforeTransform - The `before` state transform.
     * @param afterTransform - The `after` state transform.
     * @returns The interpolated transform at time `t`.
     */
    protected getTransform(t: number, beforeTransform: CompleteWorldTransform = this.resolvedBefore.completeTransform, afterTransform: CompleteWorldTransform = this.resolvedAfter.completeTransform): CompleteWorldTransform {
        const position = this.interpolatePoint(beforeTransform.position, afterTransform.position, t);
        const scale = this.interpolatePoint(beforeTransform.scale, afterTransform.scale, t);
        const rotation = this.interpolatePoint(beforeTransform.rotation, afterTransform.rotation, t);
        const rotationalCenter = this.interpolatePoint(
            beforeTransform.rotationalCenter,
            afterTransform?.rotationalCenter,
            t
        );
        return {
            position,
            scale,
            rotation,
            rotationalCenter
        };
    }

    /**
     * Sets the transforms of the object at the current frame `t`.
     * 
     * @param t - The time or progress of the animation.
     * @protected
     */
    protected setTransforms(t: number) { 
        this.currentObject.transform = this.getTransform(t);
        this.currentObject.extraTransforms = this.getExtraTransforms(t);
    }

    /**
     * Sets the material properties of the object at the current frame `t`.
     * 
     * @param t - The time or progress of the animation.
     * @protected
     */
    protected setMaterial(t: number) { 
        if (this.currentObject instanceof WebaniPrimitiveObject && this.resolvedBefore instanceof WebaniPrimitiveObject && this.resolvedAfter instanceof WebaniPrimitiveObject) {
            const normalizedT = this.backwards ? 1 - t / this.duration : t / this.duration;
            const color = this.interpolatePoint(this.resolvedBefore.material.color, this.resolvedAfter.material.color, t);
            const opacity = this.interpolationFunction(this.resolvedBefore.material.opacity, this.resolvedAfter.material.opacity, normalizedT);
            const metallic = this.interpolationFunction(this.resolvedBefore.material.metallic, this.resolvedAfter.material.metallic, normalizedT);
            const roughness = this.interpolationFunction(this.resolvedBefore.material.roughness, this.resolvedAfter.material.roughness, normalizedT);

            this.currentObject.material.color = color;
            this.currentObject.material.metallic = metallic; 
            this.currentObject.material.roughness = roughness;
            this.currentObject.material.opacity = opacity;
        }
    }

    /**
     * Retrieves the extra transforms of the object at the current frame `t`.
     * 
     * @param t - The time or progress of the animation.
     * @returns The interpolated extra transforms at time `t`.
     */
    protected getExtraTransforms(t: number): WorldTransform[] {
        return this.resolvedBefore.completeExtraTransforms.map((x, i) =>
            this.getTransform(t, x, this.resolvedAfter.completeExtraTransforms[i])
        );
    }

    /**
     * Linear interpolation function.
     * 
     * @param before - The start value.
     * @param after - The end value.
     * @param t - The progress of the interpolation.
     * @returns The interpolated value.
     */
    static lerp(before: number, after: number, t: number): number {
        return before + t * (after - before);
    }

    /**
     * Cubic interpolation function.
     * 
     * @param before - The start value.
     * @param after - The end value.
     * @param t - The progress of the interpolation.
     * @returns The interpolated value with cubic easing.
     */
    static cubic(before: number, after: number, t: number): number {
        return WebaniInterpolatedAnimation.lerp(before, after, Math.pow(t, 3));
    }

    /**
     * Ease-in-out interpolation function.
     * 
     * @param before - The start value.
     * @param after - The end value.
     * @param t - The progress of the interpolation.
     * @returns The interpolated value with ease-in-out easing.
     */
    static easeInOut(before: number, after: number, t: number): number {
        return WebaniInterpolatedAnimation.lerp(before, after, 0.5 * (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))))); 
    }
}