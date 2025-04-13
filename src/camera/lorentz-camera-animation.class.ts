import { LorentzInterpolatedAnimation } from "../animations/lorentz-interpolated-animation.class";
import { LorentzCamera } from "./lorentz-camera.class";

export class LorentzCameraAnimation extends LorentzInterpolatedAnimation<LorentzCamera> {
    _resolveAnimation(): void {
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
    }

    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    frame(t: number) {
        return new LorentzCamera();
    }
}