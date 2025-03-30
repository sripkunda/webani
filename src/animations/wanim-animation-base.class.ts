import { ObjectLike } from "../objects/object-like.type";

export abstract class WanimAnimationBase {
    abstract frame(t: number): ObjectLike;
    abstract done(t: number): boolean;
}