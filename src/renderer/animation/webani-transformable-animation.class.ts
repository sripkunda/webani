import { WebaniTransformable } from "../scene/webani-transformable.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";

/**
 * A specific implementation of `WebaniInterpolatedAnimation` for animating a `WebaniTransformable` object.
 * This class handles the interpolation of transform properties over time for transformable objects.
 */
export class WebaniTransformableAnimation extends WebaniInterpolatedAnimation<WebaniTransformable> {
    
    /**
     * Resolves the `before` and `after` transformable states by creating shallow copies of them.
     * Initializes the current object with a shallow copy of the `before` state.
     */
    resolveAnimation(): void {
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
        this.currentObject = this.resolvedBefore.shallowCopy;
    }

    /**
     * Determines if the animation has completed.
     * The animation is considered done when the time `t` exceeds the duration.
     * 
     * @param t - The time of the animation.
     * @returns `true` if the animation has completed, otherwise `false`.
     */
    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    /**
     * Sets the transforms for the current object based on the frame time `t`.
     * This method is responsible for applying the interpolated transforms to the object.
     * 
     * @param t - The time of the animation.
     * @returns The `WebaniTransformable` object with the applied transforms for the current frame.
     */
    setFrame(t: number) {
        this.setTransforms(t);
        return this.currentObject;
    }
}
