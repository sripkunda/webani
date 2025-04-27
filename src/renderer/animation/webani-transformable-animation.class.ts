import { WebaniTransformable } from "../scene/webani-transformable.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";

export class WebaniTransformableAnimation extends WebaniInterpolatedAnimation<WebaniTransformable> {
    resolveAnimation(): void {
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
        this.currentObject = this.resolvedBefore.shallowCopy;
    }

    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    setFrame(t: number) {
        this.setTransforms(t);
        return this.currentObject;
    }
}