import { WebaniCollection } from "./webani-collection.class";
import { WebaniPolygon } from "../polygons/webani-polygon.class";
import { WebaniInterpolatedAnimation } from "../../animation/webani-interpolated-animation.class";
import { WebaniPrimitiveObject } from "../webani-primitive-object.class";

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
        return this.resolvedBefore;
    }

    get after(): WebaniCollection {
        return this.resolvedAfter;
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
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
        this.currentObject = this.unresolvedBefore.shallowCopy;
        if (this.resolvedBefore.unresolvedObjects.length === 0 || this.resolvedAfter.unresolvedObjects.length === 0) return;

        while (this.resolvedBefore.unresolvedObjects.length !== this.resolvedAfter.unresolvedObjects.length) {
            if (this.resolvedBefore.unresolvedObjects.length < this.resolvedAfter.unresolvedObjects.length) {
                this.resolvedBefore.add(
                    this.resolvedBefore.unresolvedObjects[this.resolvedBefore.unresolvedObjects.length - 1]
                );
            } else {
                this.resolvedAfter.add(
                    this.resolvedAfter.unresolvedObjects[this.resolvedAfter.unresolvedObjects.length - 1]
                );
            }
        }

        this.animations = this.resolvedBefore.unresolvedObjects.map(
            (before, i) => {
                if (before.animationClass) { 
                    return new before.animationClass(
                        {
                            before,
                            after: this.resolvedAfter.unresolvedObjects[i],
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
        this.setTransforms(t);
        for (let i = 0; i < this.currentObject.unresolvedObjects.length; i++) { 
            this.currentObject.unresolvedObjects[i] = this.animations[i].frame(t);
        }
        return this.currentObject;
    }
}
