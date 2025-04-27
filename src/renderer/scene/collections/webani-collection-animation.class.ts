import { WebaniCollection } from "./webani-collection.class";
import { WebaniPolygon } from "../polygons/webani-polygon.class";
import { WebaniInterpolatedAnimation } from "../../animation/webani-interpolated-animation.class";
import { WebaniPrimitiveObject } from "../webani-primitive-object.class";
import { WebaniTransformable } from "../webani-transformable.class";
import { WebaniTransformableAnimation } from "../../animation/webani-transformable-animation.class";

export type WebaniCollectionAnimationOptions = {
    before: WebaniCollection<WebaniTransformable> | WebaniPolygon;
    after: WebaniCollection<WebaniTransformable> | WebaniPolygon;
    duration?: number;
    backwards?: boolean;
    interpolationFunction?: (before: number, after: number, t: number) => number;
};

export class WebaniCollectionAnimation extends WebaniInterpolatedAnimation<WebaniCollection<WebaniTransformable>> {
    animations!: WebaniInterpolatedAnimation<WebaniTransformable>[];

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

    get before(): WebaniCollection<WebaniTransformable> {
        return this.resolvedBefore;
    }

    get after(): WebaniCollection<WebaniTransformable> {
        return this.resolvedAfter;
    }

    set before(value: WebaniCollection<WebaniTransformable>) { 
        this.unresolvedBefore = value;
        this.resolveAnimation();
    }

    set after(value: WebaniCollection<WebaniTransformable>) { 
        this.unresolvedAfter = value;
        this.resolveAnimation();
    }

    resolveAnimation() {
        this.animations = [];
        if (!(this.unresolvedBefore instanceof WebaniCollection) || !(this.unresolvedAfter instanceof WebaniCollection)) return;
        this.resolvedBefore = this.unresolvedBefore.shallowCopy;
        this.resolvedAfter = this.unresolvedAfter.shallowCopy;
        this.currentObject = this.unresolvedBefore.shallowCopy;
        if (this.resolvedBefore.objectArray.length === 0 || this.resolvedAfter.objectArray.length === 0) return;

        while (this.resolvedBefore.objectArray.length !== this.resolvedAfter.objectArray.length) {
            if (this.resolvedBefore.objectArray.length < this.resolvedAfter.objectArray.length) {
                this.resolvedBefore.add(
                    this.resolvedBefore.objectArray[this.resolvedBefore.objectArray.length - 1]
                );
            } else {
                this.resolvedAfter.add(
                    this.resolvedAfter.objectArray[this.resolvedAfter.objectArray.length - 1]
                );
            }
        }

        this.animations = this.resolvedBefore.objectArray.map(
            (before, i) => {
                const animationClass = before.animationClass || WebaniTransformableAnimation; 
                return new animationClass(
                    {
                        before,
                        after: this.resolvedAfter.objectArray[i],
                        duration: this.duration,
                        backwards: this.backwards,
                        interpolationFunction: this.interpolationFunction
                    }
                );
            }
        );
    }

    setFrame(t: number): WebaniCollection<WebaniTransformable> {
        this.setTransforms(t);
        for (let i = 0; i < this.currentObject.objectArray.length; i++) { 
            this.currentObject.objectArray[i] = this.animations[i].frame(t);
        }
        return this.currentObject;
    }
}
