import { WebaniInterpolatedAnimation } from "../animations/webani-interpolated-animation.class";
import { WebaniMesh } from "../objects/webani-mesh.class";

export class WebaniMeshAnimation extends WebaniInterpolatedAnimation<WebaniMesh> {
    resolveAnimation(): void {
        this.resolvedBefore = this.unresolvedBefore.copy;
        this.resolvedAfter = this.unresolvedAfter.copy;
        this.currentObject = this.resolvedBefore.copy;
    }

    done(t: number): boolean {
        return t / this.duration >= 1;    
    }

    setFrame(t: number) {
        this.currentObject.transform = this.getTransform(t);
        this.currentObject.extraTransforms = this.getExtraTransforms(t);
        this.currentObject.material = this.getMaterial(t);
        return this.currentObject;
    }
}