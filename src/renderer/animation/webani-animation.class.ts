import { WebaniTransformable } from "../scene/webani-transformable.class";

export abstract class WebaniAnimation {
    abstract frame(t: number): WebaniTransformable;
    abstract done(t: number): boolean
}