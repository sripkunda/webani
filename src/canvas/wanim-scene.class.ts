import { WanimCollection } from "../objects/wanim-collection.class";
import { WanimObject } from "../objects/wanim-object.class";

export class WanimScene {

    _members: (WanimCollection | WanimObject)[] = [];

    constructor(...members: (WanimCollection | WanimObject)[]) {
        this._members = members;
    }

    get objects() {
        return this._members.map(x => (x instanceof WanimCollection) ? x._objects : x).flat();
    }

    add(object: WanimCollection | WanimObject): number {
        if (object instanceof WanimCollection || object instanceof WanimObject) {
            this._members.push(object);
        }
        return this._members.length - 1;
    }

    remove(object: WanimObject | WanimCollection): WanimScene {
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