import { RenderedGroupNode } from "../animation/rendered-group-node.class";
import { WebaniCollection } from "./collections/webani-collection.class";
import { RenderableObject } from "../types/renderable-object.type";
import { ExecuteWhenSetFromParent, ExecuteWhenSetFromSelf, ResolveWebaniVariables } from "../variables/resolvers";

export abstract class Component extends RenderedGroupNode {
    
    constructor(...vars: unknown[]) {
        super(new WebaniCollection([]));
        Object.assign(this, this.generate(...vars));
    }

    private generate(...vars: unknown[]) { 
          const renderedCollection = new RenderedGroupNode(this.objectConstructor(...ResolveWebaniVariables(...vars)));
          ExecuteWhenSetFromSelf((...vars: unknown[]) => {
            renderedCollection.TransformInto(this.objectConstructor(...vars));
          }, ...vars);
          ExecuteWhenSetFromParent((...vars: unknown[]) => {
            renderedCollection.TransformInto(this.objectConstructor(...vars), 500, true);
          }, ...vars);
          return renderedCollection;
    }

    static GetGenerator<T extends Component>(this: new (...args: unknown[]) => T) { 
      return (...vars: Parameters<T["objectConstructor"]>) => {
        return new this(...vars);
      }
    }

    abstract objectConstructor(...vars: unknown[]): RenderableObject;
}