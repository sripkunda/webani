import { WebaniTransformable } from "../objects/webani-transformable.class";
import { WebaniAnimation } from "./webani-animation.class";
import { WebaniCollectionAnimation } from "./webani-collection-animation.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";

export class AnimationSet extends WebaniAnimation {
    animations: WebaniCollectionAnimation[];
    nextIsAsynchronous: boolean;
    private animationAddedHandlers: ((animation: WebaniInterpolatedAnimation<WebaniTransformable>, asynchronous: boolean) => void)[];
    private defaultObject?: WebaniTransformable;
    constructor(...animations: WebaniCollectionAnimation[]) {
        super();
        this.animations = animations;
        this.nextIsAsynchronous = false;
        this.animationAddedHandlers = [];
    }

    get last(): WebaniCollectionAnimation {
        return this.animations[this.animations.length - 1];
    }

    get duration(): number {
        return this.animations.reduce((sum, frame) => sum + frame.duration, 0);
    }

    setDefaultObject(object: WebaniTransformable) { 
        this.defaultObject = object;
    }
    onAnimationAdded<T extends WebaniTransformable>(handler: (animation: WebaniInterpolatedAnimation<T>, asynchronous: boolean) => void): void {
        this.animationAddedHandlers.push(handler);
    }

    addAnimation(animation: WebaniCollectionAnimation, asynchronous = true): void {
        if (this.nextIsAsynchronous) {
            this.last.after = animation.frame(this.last.duration);
            if (this.last.duration < animation.duration) {
                const remainingAnimation = new WebaniCollectionAnimation(
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
        this.setDefaultObject(animation.after);
        this.animationAddedHandlers.forEach((handler) => handler(animation, asynchronous));
    }

    done(t: number): boolean {
        if (this.animations.length < 1) return true;
        return t / this.duration >= 1;
    }

    frame(t: number) {
        if (this.animations.length < 1) {
            if (this.defaultObject)
                return this.defaultObject; 
            else 
                throw Error("Animation set does not have animations or a default object, but it is still attempting to be played.");
        }
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