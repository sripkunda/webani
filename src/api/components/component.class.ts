import { RenderedCollection } from "../../animations/rendered-collection.class";
import { ObjectLike } from "../../types/object-like.type";
import { WebaniCollection } from "../../objects/webani-collection.class";
import { ExecuteWhenSetFromParent, ExecuteWhenSetFromSelf, ResolveWebaniVariables } from "../../variables/resolvers";

export abstract class Component extends RenderedCollection {
    
    constructor(...vars: unknown[]) {
        super(new WebaniCollection([]), false);
        Object.assign(this, this.generate(...vars));
    }

    private generate(...vars: unknown[]) { 
          const renderedCollection = new RenderedCollection(this.objectConstructor(...ResolveWebaniVariables(...vars)));
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

    abstract objectConstructor(...vars: unknown[]): ObjectLike;
}