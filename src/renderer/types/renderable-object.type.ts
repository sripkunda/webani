import { RenderedGroupNode } from "../animation/rendered-group-node.class";
import { WebaniCollection } from "../scene/collections/webani-collection.class";
import { WebaniPrimitiveObject } from "../scene/webani-primitive-object.class";

export type RenderableObject = WebaniCollection | WebaniPrimitiveObject | RenderedGroupNode;