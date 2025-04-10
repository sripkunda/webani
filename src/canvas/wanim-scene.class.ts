import { RenderedCollection } from "../animations/rendered-collection.class";
import { ObjectLike } from "../objects/object-like.type";
import { WanimCollection } from "../objects/wanim-collection.class";
import { WanimPolygonObject } from "../polygon/wanim-polygon.class";

export class WanimScene {

    _members: ObjectLike[] = [];

    constructor(...members: ObjectLike[]) {
        this._members = members;
    }

    get objects(): WanimPolygonObject[] {
        return this._members.map(x  => {
            if (x instanceof RenderedCollection) {
                x = x.collection;
            }
            if (x instanceof WanimCollection) {
                return x._objects;
            }
            return x;
        }).flat();
    }

    add(object: ObjectLike): number {
        this._members.push(object);
        return this._members.length - 1;
    }

    remove(object: ObjectLike): WanimScene {
        this._members = this.objects.filter(x => x !== object);
        return this;
    }

    clear(): WanimScene { 
        this._members = [];
        return this;
    }

    removeIndex(index: number) {
        this._members.splice(index, 1);
        return this;
    }
}