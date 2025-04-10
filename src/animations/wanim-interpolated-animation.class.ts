import { WanimAnimatable } from "./wanim-animatable.type";
import { WanimAnimation } from "./wanim-animation.class";

export abstract class WanimInterpolatedAnimation<T extends WanimAnimatable> extends WanimAnimation {
    _before!: T;
    _after!: T;
    duration!: number;
    backwards!: boolean;
    protected resolvedBefore!: T;
    protected resolvedAfter!: T;
    interpolationFunction: (before: number, after: number, t: number) => number;

    constructor(
        before: T, 
        after: T, 
        duration: number = 1000,
        backwards: boolean = false, 
        interpolationFunction?: (before: number, after: number, t: number) => number
    ) {
        super();
        this._before = before;
        this._after = after;
        this.duration = duration;
        this.backwards = backwards;
        this.interpolationFunction = interpolationFunction || WanimInterpolatedAnimation.easeInOut;
        this._resolveAnimation();
    }

    abstract frame(t: number): T;

    abstract _resolveAnimation(): void;

    progress(t: number): number { 
        const normalizedT = t / this.duration;
        return this.interpolationFunction(0, 1, normalizedT);  
    }

    done(t: number): boolean {
        return this.progress(t) >= 1;
    }

    get before(): T { 
        return this._before;
    }

    get after(): T { 
        return this._after;
    }

    set before(value: T) { 
        this._before = value;
        this._resolveAnimation();
    }

    set after(value: T) { 
        this._after = value;
        this._resolveAnimation();
    }

    static lerp(before: number, after: number, t: number): number {
        return before + t * (after - before);
    }

    static cubic(before: number, after: number, t: number): number {
        return WanimInterpolatedAnimation.lerp(before, after, Math.pow(t, 3));
    }

    static easeInOut(before: number, after: number, t: number): number {
        return WanimInterpolatedAnimation.lerp(before, after, 0.5 * (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))));
    }
}