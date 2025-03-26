export abstract class WanimAnimationBase {
    abstract frame(t: number): void;
    abstract done(t: number): void;
}