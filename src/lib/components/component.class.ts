import { RenderedCollection } from "../../animations/rendered-collection.class";
import { ObjectLike } from "../../objects/object-like.type";
import { WanimCollection } from "../../objects/wanim-collection.class";
import { ExecuteWhenSetFromParent, ExecuteWhenSetFromSelf, ResolveWanimVariables } from "../../variables/resolvers";

export abstract class Component extends RenderedCollection {
    
    constructor(...vars: any[]) {
        super(new WanimCollection([]), false);
        Object.assign(this, this.generate(...vars));
    }

    private generate(...vars: any[]) { 
          const renderedCollection = new RenderedCollection(this.objectConstructor(...ResolveWanimVariables(...vars)));
          ExecuteWhenSetFromSelf((...vars: any[]) => {
            renderedCollection.TransformInto(this.objectConstructor(...vars));
          }, ...vars);
          ExecuteWhenSetFromParent((...vars: any[]) => {
            renderedCollection.TransformInto(this.objectConstructor(...vars), 500, true);
          }, ...vars);
          return renderedCollection;
    }

    static GetGenerator<T extends Component>(this: new (...args: any[]) => T) { 
      return (...vars: Parameters<T["objectConstructor"]>) => {
        return new this(...vars);
      }
    }

    abstract objectConstructor(...vars: any[]): ObjectLike;
}