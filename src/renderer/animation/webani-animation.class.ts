import { WebaniTransformable } from "../scene/webani-transformable.class";

/**
 * Abstract class representing an animation that can modify a `WebaniTransformable` object.
 * 
 * This class serves as a blueprint for animations. Subclasses must implement the `frame` method to define
 * how the transformation changes over time, and the `done` method to specify when the animation has finished.
 */
export abstract class WebaniAnimation {
    /**
     * This method should define how the transformation of a `WebaniTransformable` object changes at each frame.
     * 
     * @param t - The current time or progress of the animation. This is typically either a value between 0 and 1 or 
     * the time in milliseconds since the start of the animation.
     * @returns The `WebaniTransformable` object with updated transformation for the current frame.
     */
    abstract frame(t: number): WebaniTransformable;

    /**
     * Determines whether the animation is complete based on the current time or progress.
     * 
     * @param t - The current time or progress of the animation. This is typically either a value between 0 and 1 or 
     * the time in milliseconds since the start of the animation.
     * @returns A boolean indicating whether the animation has finished.
     */
    abstract done(t: number): boolean;
}