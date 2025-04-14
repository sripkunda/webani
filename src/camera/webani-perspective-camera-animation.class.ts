import { WebaniInterpolatedAnimation } from "../animations/webani-interpolated-animation.class";
import { WebaniPerspectiveCamera } from "./webani-perspective-camera.class";

export class WebaniPerspectiveCameraAnimation extends WebaniInterpolatedAnimation<WebaniPerspectiveCamera> {
    resolveAnimation(): void {
        this.resolvedBefore = this.unresolvedBefore.copy;
        this.resolvedAfter = this.unresolvedAfter.copy;
    }

    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    frame(t: number) {
        return new WebaniPerspectiveCamera();
    }
}