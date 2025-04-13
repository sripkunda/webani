import { WebaniInterpolatedAnimation } from "../animations/webani-interpolated-animation.class";
import { WebaniCamera } from "./webani-camera.class";

export class WebaniCameraAnimation extends WebaniInterpolatedAnimation<WebaniCamera> {
    _resolveAnimation(): void {
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
    }

    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    frame(t: number) {
        return new WebaniCamera();
    }
}