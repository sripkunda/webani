import { WanimAnimationBase } from "./wanim-animation-base.class";
import { WanimCollectionAnimation } from "./wanim-collection-animation.class";
import { WanimInterpolatedAnimationBase } from "./wanim-interpolated-animation-base.class";

export class AnimationSet extends WanimAnimationBase {
    animations: WanimCollectionAnimation[];
    nextIsAsynchronous: boolean;
    _onAnimationAdded: ((animation: WanimCollectionAnimation, asynchronous: boolean) => void)[];

    constructor(...animations: WanimCollectionAnimation[]) {
        super();
        this.animations = animations;
        this.nextIsAsynchronous = false;
        this._onAnimationAdded = [];
    }

    get last(): WanimCollectionAnimation {
        return this.animations[this.animations.length - 1];
    }

    get duration(): number {
        return this.animations.reduce((sum, frame) => sum + frame.duration, 0);
    }

    onAnimationAdded(handler: (animation: WanimCollectionAnimation, asynchronous: boolean) => void): void {
        this._onAnimationAdded.push(handler);
    }

    addAnimation(animation: WanimCollectionAnimation, asynchronous = true): void {
        if (this.nextIsAsynchronous) {
            this.last.after = animation.frame(this.last.duration);
            if (this.last.duration < animation.duration) {
                const remainingAnimation = new WanimCollectionAnimation(
                    animation.frame(this.last.duration),
                    animation.frame(animation.duration),
                    animation.duration - this.last.duration,
                    animation.backwards,
                    animation.cacheFrames,
                    animation.interpolationFunction
                );
                this.animations.push(remainingAnimation);
            }
        } else {
            this.animations.push(animation);
        }
        this.nextIsAsynchronous = asynchronous;
        this._onAnimationAdded.forEach((handler) => handler(animation, asynchronous));
    }

    done(t: number): boolean {
        return t / this.duration >= 1;
    }

    frame(t: number): any {
        let durations = 0;
        for (const animation of this.animations) {
            if (t < animation.duration + durations) {
                return animation.frame(t - durations);
            }
            durations += animation.duration;
        }
        return this.last.after;
    }

    get length(): number {
        return this.animations.length;
    }
}