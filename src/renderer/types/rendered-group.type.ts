import { RenderedGroupNode } from "../animation/rendered-group-node.class";

export type RenderedGroup<T> = RenderedGroupNode & { 
    [K in keyof T]: T[K] extends RenderedGroupNode ? T[K] : RenderedGroupNode 
}