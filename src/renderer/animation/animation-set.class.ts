import { WebaniTransformable } from "../scene/webani-transformable.class";
import { WebaniAnimation } from "./webani-animation.class";
import { WebaniCollectionAnimation } from "../scene/collections/webani-collection-animation.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";
import { WebaniCollection } from "../scene/collections/webani-collection.class";

/**
 * Represents a set of animations that can be played sequentially or asynchronously.
 */
export class AnimationSet extends WebaniAnimation {
    /**
     * The list of animations in the set.
     * @type {WebaniCollectionAnimation[]}
     */
    animations: WebaniCollectionAnimation[];

    /**
     * Indicates if the next animation to be added should be asynchronous.
     * @type {boolean}
     */
    nextIsAsynchronous: boolean;

    /**
     * A list of handlers that are called whenever an animation is added to the set.
     * @type {((animation: WebaniInterpolatedAnimation<WebaniTransformable>, asynchronous: boolean) => void)[]}
     */
    private animationAddedHandlers: ((animation: WebaniInterpolatedAnimation<WebaniTransformable>, asynchronous: boolean) => void)[];

    /**
     * An optional default object used in case no specific object is set for the animation.
     * @type {WebaniTransformable | undefined}
     */
    private defaultObject?: WebaniTransformable;

    /**
     * Creates a new `AnimationSet` instance.
     * Initializes with a set of animations that will be managed and played in the set.
     * 
     * @param {...WebaniCollectionAnimation[]} animations - The initial animations to be included in the set.
     */
    constructor(...animations: WebaniCollectionAnimation[]) {
        super();
        this.animations = animations;
        this.nextIsAsynchronous = false;
        this.animationAddedHandlers = [];
    }

    /**
     * Gets the last animation in the set.
     * 
     * @returns {WebaniCollectionAnimation} The last animation in the set.
     */
    get last(): WebaniCollectionAnimation {
        return this.animations[this.animations.length - 1];
    }

    /**
     * Gets the total duration of all animations in the set.
     * This is the sum of the durations of all the animations.
     * 
     * @returns {number} The total duration of the animation set.
     */
    get duration(): number {
        return this.animations.reduce((sum, frame) => sum + frame.duration, 0);
    }

    /**
     * Sets the default object for the animation set.
     * This object is used if no specific object is provided for an animation.
     * 
     * @param {WebaniTransformable} object - The default object to be used in animations.
     */
    setDefaultObject(object: WebaniTransformable) { 
        this.defaultObject = object;
    }

    /**
     * Registers a handler that will be called whenever an animation is added to the set.
     * The handler receives the added animation and whether it is asynchronous.
     * 
     * @param {(animation: WebaniInterpolatedAnimation<T>, asynchronous: boolean) => void} handler - The handler to be called when an animation is added.
     */
    onAnimationAdded<T extends WebaniTransformable>(handler: (animation: WebaniInterpolatedAnimation<T>, asynchronous: boolean) => void): void {
        this.animationAddedHandlers.push(handler);
    }

    /**
     * Adds a new animation to the set. The animation can either be synchronous or asynchronous.
     * If the next animation is asynchronous, it will be appended after the last animation.
     * If it is not asynchronous, it will play immediately after the current animation ends.
     * 
     * @param {WebaniCollectionAnimation} animation - The animation to add.
     * @param {boolean} [asynchronous=true] - Whether the animation should be added asynchronously.
     */
    addAnimation(animation: WebaniCollectionAnimation, asynchronous = true): void {
        if (this.nextIsAsynchronous) {
            this.last.after = animation.frame(this.last.duration);
            if (this.last.duration < animation.duration) {
                const remainingAnimation = new WebaniCollectionAnimation({
                    before: animation.frame(this.last.duration),
                    after: animation.frame(animation.duration),
                    duration: animation.duration - this.last.duration,
                    backwards: animation.backwards,
                    interpolationFunction: animation.interpolationFunction
                });
                this.animations.push(remainingAnimation);
            }
        } else {
            this.animations.push(animation);
        }
        this.nextIsAsynchronous = asynchronous;
        this.setDefaultObject(animation.after);
        this.animationAddedHandlers.forEach((handler) => handler(animation, asynchronous));
    }

    /**
     * Determines if the animation set is done based on the current time.
     * 
     * @param {number} t - The current time of the animation.
     * @returns {boolean} `true` if the animation set is done, `false` otherwise.
     */
    done(t: number): boolean {
        if (this.animations.length < 1) return true;
        return t / this.duration >= 1;
    }

    /**
     * Gets the current frame of the animation set based on the given time.
     * The method finds the appropriate animation to play based on the time `t`.
     * 
     * @param {number} t - The current time of the animation.
     * @returns {WebaniTransformable | WebaniCollection} The transformed object at the current frame.
     */
    frame(t: number) {
        if (this.animations.length < 1) {
            return this.defaultObject || new WebaniCollection([]); 
        }
        let durations = 0;
        for (const animation of this.animations) {
            if (t < animation.duration + durations) {
                return animation.frame(t - durations);
            }
            durations += animation.duration;
        }
        return this.last.after;
    }

    /**
     * Gets the total number of animations in the set.
     * 
     * @returns {number} The length of the animation set.
     */
    get length(): number {
        return this.animations.length;
    }
}