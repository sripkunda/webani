import { WebaniInterpolatedAnimation } from "../renderer/animation/webani-interpolated-animation.class";
import { WebaniPerspectiveCamera } from "../renderer/scene/webani-perspective-camera.class";

export class WebaniPerspectiveCameraAnimation extends WebaniInterpolatedAnimation<WebaniPerspectiveCamera> {
    resolveAnimation(): void {
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
    }

    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    setFrame(t: number) {
        return new WebaniPerspectiveCamera();
    }
}