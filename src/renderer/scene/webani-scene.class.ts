import { RenderedGroupNode } from "../animation/rendered-group-node.class";
import { RenderableObject } from "../types/renderable-object.type";
import { WebaniCollection } from "./collections/webani-collection.class";
import { WebaniPrimitiveObject } from "./webani-primitive-object.class";

export class WebaniScene {

    _members: RenderableObject[] = [];

    constructor(...members: RenderableObject[]) {
        this._members = members;
    }

    get objects(): WebaniPrimitiveObject[] {
        return this._members.map(x => {
            if (x instanceof RenderedGroupNode) {
                x = x.collection;
            }
            if (x instanceof WebaniCollection) {
                return x.objects;
            } 
            return x;
        }).flat();
    }

    add(object: RenderableObject): number {
        this._members.push(object);
        return this._members.length - 1;
    }

    remove(object: RenderableObject): WebaniScene {
        this._members = this.objects.filter(x => x !== object);
        return this;
    }

    clear(): WebaniScene { 
        this._members = [];
        return this;
    }

    removeIndex(index: number) {
        this._members.splice(index, 1);
        return this;
    }
}