import { VectorUtils } from "../../util/vector.utils";
import { WebaniTransformable } from "../webani-transformable.class";
import { WebaniCollectionAnimation } from "./webani-collection-animation.class";

export class WebaniCollection<T extends WebaniTransformable> extends WebaniTransformable {
    protected _objectArray: T[];
    
    constructor(objects: T[] | T) {
        super();
        this._objectArray = [];
        if (objects instanceof WebaniCollection) { 
            return objects;
        }
        if (Array.isArray(objects)) {
            this.add(...objects);
        } else {
            this.add(objects);
        }
    }

    animationClass = WebaniCollectionAnimation;

    get shallowCopy(): this { 
        const clone = super.shallowCopy as this;
        clone._objectArray = this._objectArray.map(x => x.shallowCopy); 
        return clone;
    }

    get objectArray(): T[] {
        return [...this._objectArray];
    }
    
    set objectArray(value: T[]) { 
        this._objectArray = value;
    }

    get localCenter()  {
        return VectorUtils.center(this.flatObjects.map(x => x.localCenter));
    }

    get center() {
        return VectorUtils.center(this.flatObjects.map(x => x.center));
    }

    get flatObjects(): T[] { 
        const flatObjectList: T[] = [];
        this._objectArray.forEach(obj => {
            const copy = obj.shallowCopy;
            if (!copy.parent) { 
                copy.parent = this;
            } else {
                copy.extraTransforms.push(this.transform, ...this.extraTransforms);
            }
            if (copy instanceof WebaniCollection) {
                flatObjectList.push(...copy.flatObjects); 
            } else { 
                flatObjectList.push(copy);
            }
        });
        return flatObjectList;
    }

    add(...newObjects: T[]): number {
        this._objectArray.push(...newObjects);
        return this._objectArray.length - 1;
    }

    removeIndex(index: number): this {
        this._objectArray.splice(index, 1);
        return this;
    }
}