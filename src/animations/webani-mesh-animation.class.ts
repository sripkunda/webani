import { WebaniInterpolatedAnimation } from "../renderer/animation/webani-interpolated-animation.class";
import { WebaniMesh } from "../objects/webani-mesh.class";

export class WebaniMeshAnimation extends WebaniInterpolatedAnimation<WebaniMesh> {
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
        this.setMaterial(t);
        return this.currentObject;
    }
}