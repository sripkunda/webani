import { RenderedCollection } from "../../animations/rendered-collection.class";
import { ObjectLike } from "../../objects/object-like.type";
import { LorentzCollection } from "../../objects/lorentz-collection.class";
import { ExecuteWhenSetFromParent, ExecuteWhenSetFromSelf, ResolveLorentzVariables } from "../../variables/resolvers";

export abstract class Component extends RenderedCollection {
    
    constructor(...vars: unknown[]) {
        super(new LorentzCollection([]), false);
        Object.assign(this, this.generate(...vars));
    }

    private generate(...vars: unknown[]) { 
          const renderedCollection = new RenderedCollection(this.objectConstructor(...ResolveLorentzVariables(...vars)));
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