import { WebaniInterpolatedAnimation } from "../../animation/webani-interpolated-animation.class";
import { WebaniMesh } from "./webani-mesh.class";

/**
 * A class representing an animation that interpolates between two states of a mesh object.
 * This extends from `WebaniInterpolatedAnimation` and is designed to animate `WebaniMesh` objects.
 */
export class WebaniMeshAnimation extends WebaniInterpolatedAnimation<WebaniMesh> {

    /**
     * Resolves the animation by creating shallow copies of the objects before and after the animation.
     * The current object is also initialized as a shallow copy of the object before the animation.
     */
    resolveAnimation(): void {
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
        this.currentObject = this.resolvedBefore.shallowCopy;
    }

    /**
     * Checks if the animation has completed based on the current time `t`.
     * @param t The current time in the animation.
     * @returns `true` if the animation is done (i.e., `t` exceeds or equals the duration of the animation), `false` otherwise.
     */
    done(t: number): boolean {
        return t / this.duration >= 1;
    }

    /**
     * Sets the frame of the animation at time `t`, updating the transforms and material of the mesh.
     * @param t The current time in the animation.
     * @returns The current `WebaniMesh` object after the frame has been set.
     */
    setFrame(t: number) {
        this.setTransforms(t);
        this.setMaterial(t);
        return this.currentObject;
    }
}
