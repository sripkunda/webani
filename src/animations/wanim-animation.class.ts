import { WanimAnimatable } from "./wanim-animatable.type";

export abstract class WanimAnimation {
    abstract frame(t: number): WanimAnimatable;
    abstract done(t: number): boolean
}