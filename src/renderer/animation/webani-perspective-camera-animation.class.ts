import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";
import { WebaniPerspectiveCamera } from "../scene/camera/webani-perspective-camera.class";

/**
 * A specific implementation of `WebaniInterpolatedAnimation` for animating a `WebaniPerspectiveCamera` object.
 * This class handles the interpolation of camera properties over time.
 */
export class WebaniPerspectiveCameraAnimation extends WebaniInterpolatedAnimation<WebaniPerspectiveCamera> {
    
    /**
     * Resolves the `before` and `after` camera states by creating shallow copies of them.
     * This ensures that the original camera objects are not mutated during the animation.
     */
    resolveAnimation(): void {
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
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
     * Sets the camera state at the current frame of the animation.
     * This method will create a new `WebaniPerspectiveCamera` object.
     * 
     * @param t - The time of the animation.
     * @returns A new instance of `WebaniPerspectiveCamera`.
     */
    setFrame(t: number) {
        return new WebaniPerspectiveCamera();
    }
}
