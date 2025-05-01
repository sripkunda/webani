import { WebaniCollection } from "./webani-collection.class";
import { WebaniPolygon } from "../polygons/webani-polygon.class";
import { WebaniInterpolatedAnimation } from "../../animation/webani-interpolated-animation.class";
import { WebaniPrimitiveObject } from "../webani-primitive-object.class";
import { WebaniTransformable } from "../webani-transformable.class";
import { WebaniTransformableAnimation } from "../../animation/webani-transformable-animation.class";

/**
 * Options for animating a collection of `WebaniTransformable` objects or a `WebaniPolygon`.
 * 
 * @typedef {Object} WebaniCollectionAnimationOptions
 * @property {WebaniCollection<WebaniTransformable> | WebaniPolygon} before - The starting state of the collection or polygon.
 * @property {WebaniCollection<WebaniTransformable> | WebaniPolygon} after - The target state of the collection or polygon.
 * @property {number} [duration=1000] - The duration of the animation in milliseconds.
 * @property {boolean} [backwards=false] - Whether to play the animation backwards.
 * @property {(before: number, after: number, t: number) => number} [interpolationFunction=WebaniInterpolatedAnimation.easeInOut] - The interpolation function to use for animation.
 */
export type WebaniCollectionAnimationOptions = {
    before: WebaniCollection<WebaniTransformable> | WebaniPolygon;
    after: WebaniCollection<WebaniTransformable> | WebaniPolygon;
    duration?: number;
    backwards?: boolean;
    interpolationFunction?: (before: number, after: number, t: number) => number;
};

/**
 * A class that animates a collection of `WebaniTransformable` objects or a `WebaniPolygon`.
 * This class manages the interpolation of all objects within the collection over time.
 * 
 * The animation is based on interpolating each object inside the collection from its `before` state to its `after` state.
 * 
 * @extends WebaniInterpolatedAnimation<WebaniCollection<WebaniTransformable>>
 */
export class WebaniCollectionAnimation extends WebaniInterpolatedAnimation<WebaniCollection<WebaniTransformable>> {
    /**
     * An array of animations for each individual `WebaniTransformable` object inside the collection.
     * @type {WebaniInterpolatedAnimation<WebaniTransformable>[]}
     */
    animations!: WebaniInterpolatedAnimation<WebaniTransformable>[];

    /**
     * Creates a new `WebaniCollectionAnimation` instance.
     * This constructor sets up the animations for all objects within the collection.
     * 
     * @param {WebaniCollectionAnimationOptions} options - The configuration options for the animation.
     */
    constructor({
        before,
        after,
        duration = 1000,
        backwards = false,
        interpolationFunction = WebaniInterpolatedAnimation.easeInOut,
    }: WebaniCollectionAnimationOptions) {
        const _before = before instanceof WebaniPolygon ? new WebaniCollection(before) : before;
        const _after = after instanceof WebaniPolygon ? new WebaniCollection(after) : after;
        super({
            before: _before,
            after: _after,
            duration,
            backwards,
            interpolationFunction
        });
    }

    /**
     * Retrieves the `before` state of the collection.
     * 
     * @returns {WebaniCollection<WebaniTransformable>} The `before` collection.
     */
    get before(): WebaniCollection<WebaniTransformable> {
        return this.resolvedBefore;
    }

    /**
     * Retrieves the `after` state of the collection.
     * 
     * @returns {WebaniCollection<WebaniTransformable>} The `after` collection.
     */
    get after(): WebaniCollection<WebaniTransformable> {
        return this.resolvedAfter;
    }

    /**
     * Sets the `before` state of the collection.
     * 
     * @param {WebaniCollection<WebaniTransformable>} value - The new `before` state.
     */
    set before(value: WebaniCollection<WebaniTransformable>) { 
        this.unresolvedBefore = value;
        this.resolveAnimation();
    }

    /**
     * Sets the `after` state of the collection.
     * 
     * @param {WebaniCollection<WebaniTransformable>} value - The new `after` state.
     */
    set after(value: WebaniCollection<WebaniTransformable>) { 
        this.unresolvedAfter = value;
        this.resolveAnimation();
    }

    /**
     * Resolves the animation by making sure both `before` and `after` collections are properly set up.
     * If they differ in length, the missing objects are duplicated to match.
     * It also sets up individual animations for each object in the collection.
     */
    resolveAnimation() {
        this.animations = [];
        if (!(this.unresolvedBefore instanceof WebaniCollection) || !(this.unresolvedAfter instanceof WebaniCollection)) return;
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
        this.currentObject = this.unresolvedBefore.shallowCopy;
        if (this.resolvedBefore.objectArray.length === 0 || this.resolvedAfter.objectArray.length === 0) return;

        while (this.resolvedBefore.objectArray.length !== this.resolvedAfter.objectArray.length) {
            if (this.resolvedBefore.objectArray.length < this.resolvedAfter.objectArray.length) {
                this.resolvedBefore.add(
                    this.resolvedBefore.objectArray[this.resolvedBefore.objectArray.length - 1]
                );
            } else {
                this.resolvedAfter.add(
                    this.resolvedAfter.objectArray[this.resolvedAfter.objectArray.length - 1]
                );
            }
        }

        this.animations = this.resolvedBefore.objectArray.map(
            (before, i) => {
                const animationClass = before.animationClass || WebaniTransformableAnimation; 
                return new animationClass(
                    {
                        before,
                        after: this.resolvedAfter.objectArray[i],
                        duration: this.duration,
                        backwards: this.backwards,
                        interpolationFunction: this.interpolationFunction
                    }
                );
            }
        );
    }

    /**
     * Sets the current frame of the animation, interpolating the transforms of the objects in the collection.
     * 
     * @param {number} t - The current time of the animation.
     * @returns {WebaniCollection<WebaniTransformable>} The updated collection with interpolated objects.
     */
    setFrame(t: number): WebaniCollection<WebaniTransformable> {
        this.setTransforms(t);
        for (let i = 0; i < this.currentObject.objectArray.length; i++) { 
            this.currentObject.objectArray[i] = this.animations[i].frame(t);
        }
        return this.currentObject;
    }
}
