import { WanimCollection } from "../objects/wanim-collection.class";
import { WanimPolygonObject } from "../polygon/wanim-polygon.class";
import { WanimInterpolatedAnimation } from "./wanim-interpolated-animation.class";
import { WanimPolygonAnimation } from "./wanim-polygon-animation.class";

export class WanimCollectionAnimation extends WanimInterpolatedAnimation<WanimCollection> {
    animations!: WanimPolygonAnimation[];
    cacheFrames: boolean = false;

    constructor(
        before: WanimCollection | WanimPolygonObject,
        after: WanimCollection | WanimPolygonObject,
        duration = 1000,
        backwards = false,
        cacheFrames: boolean = false,
        interpolationFunction?: (before: number, after: number, t: number) => number,
    ) {
        const _before = before instanceof WanimPolygonObject ? new WanimCollection(before) : before;
        const _after = after instanceof WanimPolygonObject ? new WanimCollection(after) : after;
        super(_before, _after, duration, backwards, interpolationFunction);
        this.cacheFrames = cacheFrames;
    }

    get before(): WanimCollection {
        return new WanimCollection(
            this.animations.map((x) => x.before),
            this._before._keepRotationCenters
        );
    }

    get after(): WanimCollection {
        return new WanimCollection(
            this.animations.map((x) => x.after),
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
        this.animations = []
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

        this.animations = this.resolvedBefore._objects.map(
            (before, i) =>
                new WanimPolygonAnimation(
                    before,
                    this.resolvedAfter._objects[i],
                    this.duration,
                    this.backwards,
                    this.cacheFrames,
                    this.interpolationFunction
                )
        );
    }

    frame(t: number): WanimCollection {
        if (t <= 0) return this.backwards ? this.after : this.before;
        if (t >= this.duration) return this.backwards ? this.before : this.after;

        return new WanimCollection(
            this.animations.map((animation) => animation.frame(t)),
            this.before._keepRotationCenters
        );
    }
}