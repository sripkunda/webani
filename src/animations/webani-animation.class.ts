import { WebaniAnimatable } from "../types/webani-animatable.type";

export abstract class WebaniAnimation {
    abstract frame(t: number): WebaniAnimatable;
    abstract done(t: number): boolean
}