import { RenderedCollection } from "../animations/rendered-collection.class";
import { ObjectLike } from "../objects/object-like.type";
import { LorentzCollection } from "../objects/lorentz-collection.class";
import { LorentzPrimitiveObject } from "../objects/lorentz-primitive-object.class";

export class LorentzScene {

    _members: ObjectLike[] = [];

    constructor(...members: ObjectLike[]) {
        this._members = members;
    }

    get objects(): LorentzPrimitiveObject[] {
        return this._members.map(x  => {
            if (x instanceof RenderedCollection) {
                x = x.collection;
            }
            if (x instanceof LorentzCollection) {
                return x._objects;
            }
            return x;
        }).flat();
    }

    add(object: ObjectLike): number {
        this._members.push(object);
        return this._members.length - 1;
    }

    remove(object: ObjectLike): LorentzScene {
        this._members = this.objects.filter(x => x !== object);
        return this;
    }

    clear(): LorentzScene { 
        this._members = [];
        return this;
    }

    removeIndex(index: number) {
        this._members.splice(index, 1);
        return this;
    }
}