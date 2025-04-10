import { ObjectLike } from "../objects/object-like.type";
import { RenderedCollection } from "./rendered-collection.class";
import { WanimAnimation } from "./wanim-animation.class";

export type Playable = ObjectLike | WanimAnimation | RenderedCollection;