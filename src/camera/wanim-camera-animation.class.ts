import { WanimInterpolatedAnimation } from "../animations/wanim-interpolated-animation.class";
import { WanimCamera } from "./wanim-camera.class";

export class WanimCameraAnimation extends WanimInterpolatedAnimation<WanimCamera> {
    _resolveAnimation(): void {
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
    }

    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    frame(t: number) {
        return new WanimCamera();
    }
}