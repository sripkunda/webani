import { RenderedGroupNode } from "../animation/rendered-group-node.class";
import { WebaniCollection } from "../scene/collections/webani-collection.class";
import { WebaniPrimitiveObject } from "../scene/webani-primitive-object.class";
import { WebaniTransformable } from "../scene/webani-transformable.class";

export type RenderableObject = WebaniTransformable | WebaniCollection<WebaniTransformable> | WebaniPrimitiveObject | RenderedGroupNode;