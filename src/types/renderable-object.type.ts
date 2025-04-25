import { RenderedGroupNode } from "../renderer/animation/rendered-group-node.class";
import { WebaniCollection } from "../renderer/scene/collections/webani-collection.class";
import { WebaniPrimitiveObject } from "../renderer/scene/webani-primitive-object.class";

export type RenderableObject = WebaniCollection | WebaniPrimitiveObject | RenderedGroupNode;