import { LorentzAnimatable } from "./lorentz-animatable.type";

export abstract class LorentzAnimation {
    abstract frame(t: number): LorentzAnimatable;
    abstract done(t: number): boolean
}