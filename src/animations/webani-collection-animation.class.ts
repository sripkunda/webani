import { WebaniCollection } from "../objects/webani-collection.class";
import { ObjectLike } from "../types/object-like.type";
import { WebaniPolygon } from "../polygon/webani-polygon.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";

export class WebaniCollectionAnimation extends WebaniInterpolatedAnimation<WebaniCollection> {
    animations!: WebaniInterpolatedAnimation<ObjectLike>[];
    cacheFrames: boolean = false;

    constructor(
        before: WebaniCollection | WebaniPolygon,
        after: WebaniCollection | WebaniPolygon,
        duration = 1000,
        backwards = false,
        cacheFrames: boolean = false,
        interpolationFunction?: (before: number, after: number, t: number) => number,
    ) {
        const _before = before instanceof WebaniPolygon ? new WebaniCollection(before) : before;
        const _after = after instanceof WebaniPolygon ? new WebaniCollection(after) : after;
        super(_before, _after, duration, backwards, interpolationFunction);
        this.cacheFrames = cacheFrames;
    }

    get before(): WebaniCollection {
        return new WebaniCollection(
            this.animations.map((x) => x.before),
            this._before._keepRotationCenters
        );
    }

    get after(): WebaniCollection {
        return new WebaniCollection(
            this.animations.map((x) => x.after),
            this._after._keepRotationCenters
        );
    }

    set before(value: WebaniCollection) { 
        this._before = value;
        this._resolveAnimation();
    }

    set after(value: WebaniCollection) { 
        this._after = value;
        this._resolveAnimation();
    }

    _resolveAnimation() {
        this.animations = []
        if (!(this._before instanceof WebaniCollection) || !(this._after instanceof WebaniCollection)) return;
        this.resolvedBefore = this._before.copy;
        this.resolvedAfter = this._after.copy;
        
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
                        before,
                        this.resolvedAfter._objects[i],
                        this.duration,
                        this.backwards,
                        this.cacheFrames,
                        this.interpolationFunction
                    )
                }
                throw Error(`Cannot generate an animation for object ${before} because there is no compatible animation class.`);
            }
        );
    }

    frame(t: number): WebaniCollection {
        if (t <= 0) return this.backwards ? this.after : this.before;
        if (t >= this.duration) return this.backwards ? this.before : this.after;

        return new WebaniCollection(
            this.animations.map((animation) => animation.frame(t)),
            this.before._keepRotationCenters
        );
    }
}