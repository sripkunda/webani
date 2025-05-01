import { RenderableObject } from "../types/renderable-object.type";
import { WebaniCollection } from "../scene/collections/webani-collection.class";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { AnimationSet } from "./animation-set.class";
import { WebaniCollectionAnimation } from "../scene/collections/webani-collection-animation.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";
import { WebaniAnimation } from "./webani-animation.class";
import { WebaniPrimitiveObject } from "../scene/webani-primitive-object.class";
import { WebaniTransformable } from "../scene/webani-transformable.class";
import { RenderedGroup } from "../types/rendered-group.type";

export class RenderedGroupNode extends WebaniAnimation {
    private _collection: WebaniCollection<WebaniTransformable>;
    private childKeys: (string | number | symbol)[] = [];
    private parent?: RenderedGroupNode;

    animationSet: AnimationSet;
    
    [key: (string | number | symbol)]: any;

    constructor(collection?: RenderableObject) {
        super();        
        this.animationSet = new AnimationSet();
        if (collection instanceof RenderedGroupNode) return collection;
        if (collection instanceof WebaniTransformable) { 
            this._collection = new WebaniCollection(collection);
        } else {
            this._collection = collection || new WebaniCollection([]);
        } 
        this.animationSet.setDefaultObject(this._collection);
    }

    static CreateGroup<T extends Object>(object: T): RenderedGroup<T> { 
        const root = new RenderedGroupNode();
        for (let key in object) { 
            if (object[key] instanceof Object) {
                root[key] = object[key] instanceof RenderedGroupNode ? object[key] : this.CreateGroup(object[key]);
                root._collection.add(root[key]._collection);
                root[key].parent = root;
                root[key]._collection.parent = root._collection;
                root.childKeys.push(key);
            } else {
                console.warn("Your group contains leaf nodes which are not objects.");
            }
        }
        return root as RenderedGroup<T>;
    }

    done(t: number) {
        return this.animationSet.done(t); 
    };

    frame(t: number) {
        return this.animationSet.frame(t);
    };

    get collection(): WebaniCollection<WebaniTransformable> {
        return this._collection;
    }

    get leaves(): RenderedGroupNode[] {
        const array: RenderedGroupNode[] = [];
        for (let child of this.childKeys) { 
            if (this[child].isLeaf) {
                array.push(this[child]);
            } else {
                array.push(...this[child].leaves);
            }
        }
        return array;
    }

    get isLeaf(): boolean { 
        return this.childKeys.length < 1;
    }

    onAnimationAdded(handler: (animation: WebaniCollectionAnimation, asynchronous: boolean) => void): void {
        this.animationSet.onAnimationAdded(handler);
    }

    get animated(): boolean {
        return this.animationSet.length > 0;
    }

    private addAnimation(animation: WebaniCollectionAnimation, asynchronous: boolean = false) {
        if (animation.duration > 0) {
            this.animationSet.addAnimation(animation, asynchronous);
            if (this.parent) { 
                const after = this.parent.collection.shallowCopy; 
                const collection = this.collection;
                after.objectArray = after.objectArray.map(object => {
                    return object == collection ? animation.after : object;
                });
                this.parent.addAnimation(new WebaniCollectionAnimation({
                    before: this.parent.collection,
                    after: after,
                    duration: animation.duration
                }));
            }
        }
        this._collection = animation.after;
        this.animationSet.setDefaultObject(animation.after);
        return this;
    }

    Hide(): void {
        this.FadeOut(0);
    }

    OverrideRotation(rotation: Vector3, center?: Vector3) { 
        return this.SetRotation(rotation, 0, center);
    }

    OverridePosition(position: Vector3) {
        return this.SetPosition(position, 0);
    }

    FadeIn(duration: number = 1000, keepInitialOpacity: boolean = false, asynchronous: boolean = false) {
        const before = this.collection.shallowCopy; 
        const after = this.collection.shallowCopy;
        before.objectArray = this.collection.objectArray.map((object) => {
            const b = object.shallowCopy;
            if (!keepInitialOpacity && b instanceof WebaniPrimitiveObject) {
                b.material.opacity = 0;
            }
            return b;
        });
        after.objectArray = this.collection.objectArray.map((object) => {
            const b = object.shallowCopy;
            if (b instanceof WebaniPrimitiveObject) {
                b.material.opacity = 1;
            } else { 
                
            }
            return b;
        });
        return this.addAnimation(new WebaniCollectionAnimation({before, after, duration}), asynchronous);
    }

    FadeOut(duration: number = 1000, asynchronous: boolean = false) {
        const after = this.collection.mapObjects((object) => {
            const a = object.shallowCopy;
            if (a instanceof WebaniPrimitiveObject) {
                a.material.opacity = 0;
            }
            return a;
        });
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after, 
            duration
        }), asynchronous);
    }

    Scale(factor: Vector3, duration: number = 1000, asynchronous: boolean = false, backwards: boolean = false) {
        const after = this.collection.shallowCopy;
        after.objectArray = this.collection.objectArray.map((object) => {
            const after = object.shallowCopy;
            after.scaleBy(factor);
            return after;
        });
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after, 
            duration, 
            backwards
        }), asynchronous);
    }

    ZoomIn(duration: number = 1000, asynchronous: boolean = false) {
        return this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous, true);
    }

    ZoomOut(duration: number = 1000, asynchronous: boolean = false) {
        this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous);
        return this.FadeOut(duration, asynchronous);
    }

    SetColor(newColor: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        const after = this.collection.shallowCopy;
        after.objectArray = this.collection.objectArray.map(obj => {
            const copy = obj.shallowCopy;
            if (copy instanceof WebaniPrimitiveObject) {
                copy.material.color = newColor;
            }
            return copy;
        });
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after, 
            duration
        }), asynchronous);
    }

    TransformInto(after: RenderableObject, duration: number = 800, asynchronous: boolean = false) {
        after = new RenderedGroupNode(after);
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after: after.collection, 
            duration: duration
        }), asynchronous);
    }

    SetRotation(rotation: Vector3, duration: number = 1000, center?: Vector3, asynchronous: boolean = false) { 
        const after = this.collection.shallowCopy;
        after.setRotation(rotation, center);
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after, 
            duration
        }), asynchronous);
    }

    SetPosition(position: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        const after = this.collection.shallowCopy;
        after.setPosition(position)
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after: after, 
            duration
        }), asynchronous);
    }

    Move(offset: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        const newCenter = VectorUtils.add(this.collection.center, offset)
        return this.SetPosition(newCenter, duration, asynchronous);
    }

    Rotate(rotation: Vector3, duration: number = 1000, center?: Vector3, asynchronous: boolean = false) {
        const after = this.collection.shallowCopy;
        after.rotate(rotation, center);
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after, 
            duration
        }), asynchronous);
    }

    Wait(duration: number) {
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after: this.collection, 
            duration: duration
        }));
    }
}