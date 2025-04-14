import { RenderedGroupNode } from "../animations/rendered-group-node.class";
import { WebaniCollection } from "../objects/webani-collection.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";

export type RenderableObject = WebaniCollection | WebaniPrimitiveObject | RenderedGroupNode;