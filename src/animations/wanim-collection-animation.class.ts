import { WanimCollection } from "../objects/wanim-collection.class";
import { WanimObject } from "../objects/wanim-object.class";
import { WanimInterpolatedAnimationBase } from "./wanim-interpolated-animation-base.class";
import { WanimObjectAnimation } from "./wanim-object-animation.class";

export class WanimCollectionAnimation extends WanimInterpolatedAnimationBase {
    _animations!: WanimObjectAnimation[];
    resolvedBefore!: WanimCollection;
    resolvedAfter!: WanimCollection;

    constructor(
        before: WanimCollection | WanimObject,
        after: WanimCollection | WanimObject,
        duration = 1000,
        backwards = false,
        interpolationFunction?: (before: number, after: number, t: number) => number
    ) {
        const _before = before instanceof WanimObject ? new WanimCollection(before) : before;
        const _after = after instanceof WanimObject ? new WanimCollection(after) : after; 
        super(_before, _after, duration, backwards, interpolationFunction);
    }

    get before(): WanimCollection {
        return new WanimCollection(
            this._animations.map((x) => x.before),
            this._before._keepRotationCenters
        );
    }

    get after(): WanimCollection {
        return new WanimCollection(
            this._animations.map((x) => x.after),
            this._after._keepRotationCenters
        );
    }

    set before(value: WanimCollection) { 
        this._before = value;
        this._resolveAnimation();
    }

    set after(value: WanimCollection) { 
        this._after = value;
        this._resolveAnimation();
    }

    _resolveAnimation() {
        if (!(this._before instanceof WanimCollection) || !(this._after instanceof WanimCollection)) return;
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

        this._animations = this.resolvedBefore._objects.map(
            (before, i) =>
                new WanimObjectAnimation(
                    before,
                    this.resolvedAfter._objects[i],
                    this.duration,
                    this.backwards,
                    this.interpolationFunction
                )
        );
    }

    frame(t: number): WanimCollection {
        if (t <= 0) return this.backwards ? this.after : this.before;
        if (t >= this.duration) return this.backwards ? this.before : this.after;

        return new WanimCollection(
            this._animations.map((animation) => animation.frame(t)),
            this.before._keepRotationCenters
        );
    }
}