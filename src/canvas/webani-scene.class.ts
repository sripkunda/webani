import { RenderedCollection } from "../animations/rendered-collection.class";
import { ObjectLike } from "../types/object-like.type";
import { WebaniCollection } from "../objects/webani-collection.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";

export class WebaniScene {

    _members: ObjectLike[] = [];

    constructor(...members: ObjectLike[]) {
        this._members = members;
    }

    get objects(): WebaniPrimitiveObject[] {
        return this._members.map(x  => {
            if (x instanceof RenderedCollection) {
                x = x.collection;
            }
            if (x instanceof WebaniCollection) {
                return x._objects;
            }
            return x;
        }).flat();
    }

    add(object: ObjectLike): number {
        this._members.push(object);
        return this._members.length - 1;
    }

    remove(object: ObjectLike): WebaniScene {
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