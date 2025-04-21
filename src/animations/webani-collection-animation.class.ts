import { WebaniCollection } from "../objects/webani-collection.class";
import { WebaniPolygon } from "../objects/webani-polygon.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";

export type WebaniCollectionAnimationOptions = {
    before: WebaniCollection | WebaniPolygon;
    after: WebaniCollection | WebaniPolygon;
    duration?: number;
    backwards?: boolean;
    interpolationFunction?: (before: number, after: number, t: number) => number;
};

export class WebaniCollectionAnimation extends WebaniInterpolatedAnimation<WebaniCollection> {
    animations!: WebaniInterpolatedAnimation<WebaniPrimitiveObject>[];

    constructor({
        before,
        after,
        duration = 1000,
        backwards = false,
        interpolationFunction = WebaniInterpolatedAnimation.easeInOut,
    }: WebaniCollectionAnimationOptions) {
        const _before = before instanceof WebaniPolygon ? new WebaniCollection(before) : before;
        const _after = after instanceof WebaniPolygon ? new WebaniCollection(after) : after;
        super({
            before: _before,
            after: _after,
            duration,
            backwards,
            interpolationFunction
        });
    }

    get before(): WebaniCollection {
        return new WebaniCollection(
            this.animations.map((x) => x.before)
        );
    }

    get after(): WebaniCollection {
        return new WebaniCollection(
            this.animations.map((x) => x.after)
        );
    }

    set before(value: WebaniCollection) { 
        this.unresolvedBefore = value;
        this.resolveAnimation();
    }

    set after(value: WebaniCollection) { 
        this.unresolvedAfter = value;
        this.resolveAnimation();
    }

    resolveAnimation() {
        this.animations = [];
        if (!(this.unresolvedBefore instanceof WebaniCollection) || !(this.unresolvedAfter instanceof WebaniCollection)) return;
        this.resolvedBefore = this.unresolvedBefore.copy;
        this.resolvedAfter = this.unresolvedAfter.copy;
        this.currentObject = this.unresolvedBefore.copy;
        if (this.resolvedBefore._objects.length === 0 || this.resolvedAfter._objects.length === 0) return;

        while (this.resolvedBefore._objects.length !== this.resolvedAfter._objects.length) {
            if (this.resolvedBefore._objects.length < this.resolvedAfter._objects.length) {
                this.resolvedBefore.add(
                    this.resolvedBefore._objects[this.resolvedBefore._objects.length - 1]
                );
            } else {
                this.resolvedAfter.add(
                    this.resolvedAfter._objects[this.resolvedAfter._objects.length - 1]
                );
            }
        }

        this.animations = this.resolvedBefore._objects.map(
            (before, i) => {
                if (before.animationClass) { 
                    return new before.animationClass(
                        {
                            before,
                            after: this.resolvedAfter._objects[i],
                            duration: this.duration,
                            backwards: this.backwards,
                            interpolationFunction: this.interpolationFunction
                        }
                    );
                }
                throw Error(`Cannot generate an animation for object ${before} because there is no compatible animation class.`);
            }
        );
    }

    setFrame(t: number): WebaniCollection {
        this.currentObject.transform = this.getTransform(t);
        this.currentObject.extraTransforms = this.getExtraTransforms(t);
        for (let i = 0; i < this.currentObject._objects.length; i++) { 
            this.currentObject._objects[i] = this.animations[i].frame(t);
        }
        return this.currentObject;
    }
}
