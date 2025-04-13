import { ObjectLike } from "../objects/object-like.type";
import { RenderedCollection } from "./rendered-collection.class";
import { LorentzAnimation } from "./lorentz-animation.class";

export type Playable = ObjectLike | LorentzAnimation | RenderedCollection;