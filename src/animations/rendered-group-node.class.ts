import { RenderableObject } from "../types/renderable-object.type";
import { WebaniCollection } from "../objects/webani-collection.class";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { AnimationSet } from "./animation-set.class";
import { WebaniCollectionAnimation } from "./webani-collection-animation.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";
import { WebaniAnimation } from "./webani-animation.class";

export class RenderedGroupNode extends WebaniAnimation {
    private _collection?: WebaniCollection;
    private childKeys: (string | number | symbol)[] = [];
    animationSet: AnimationSet;
    
    [key: (string | number | symbol)]: any;

    constructor(collection?: RenderableObject) {
        super();
        this.animationSet = new AnimationSet();
        if (collection) { 
            if (collection instanceof RenderedGroupNode) return collection;
            this._collection = new WebaniCollection(collection);
        } else { 
            this._collection = new WebaniCollection([]);
        }
        this.animationSet.setDefaultObject(this._collection);
    }

    static CreateGroup(object: object) { 
        const root = new RenderedGroupNode();
        for (let key in object) { 
            if (object[key] instanceof Object) {
                root[key] = object[key] instanceof RenderedGroupNode ? object[key] : this.CreateGroup(object[key]);
                root.childKeys.push(key);
            } else {
                console.warn("Your group contains leaf nodes which are not objects.");
            }
        }
        return root;
    }

    done(t: number) {
        if (this.isLeaf) { 
            return this.animationSet.done(t);
        }
        return this.leaves.every(x => x.animationSet.done(t)); 
    };

    frame(t: number) {
        if (this.isLeaf) {
            return this.animationSet.frame(t);
        } else {
            return new WebaniCollection(this.leaves.flatMap(x => x.frame(t)));
        }
    };

    get collection() {
        if (!this.isLeaf || !this._collection) {
            throw Error("Attempted to call collection() on RenderedGroupNode which is not a leaf node.");
        }
        return this._collection;
    }

    get center() { 
        return VectorUtils.center(this.leaves.map(obj => obj.collection.center));
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
        }
        this._collection = animation.after;
        this.animationSet.setDefaultObject(animation.after);
        return this;
    }

    protected constructAnimation(animationConstructor: (parent: RenderedGroupNode) => void, parent?: RenderedGroupNode) { 
        if (this.isLeaf) { 
            if (!animationConstructor.prototype) {
                throw Error("Animation constructors cannot be arrow functions.")
            }
            animationConstructor = animationConstructor.bind(this);
            animationConstructor(parent || this);
        } else {
            for (let key of this.childKeys) {    
                this[key].constructAnimation(animationConstructor, parent || this);
            }
        }
        return this;
    }

    Hide(): void {
        this.FadeOut(0);
    }

    SetRotation(angle: Vector3, center?: Vector3) { 
        this.Rotate(angle, 0, center);
        return this;
    }

    SetCenterPosition(position: Vector3) {
        return this.MoveCenterTo(position, 0);
    }

    FadeIn(duration: number = 1000, keepInitialOpacity: boolean = false, asynchronous: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            const beforeObjects = this.collection.objects.map((object) => {
                const b = object.copy;
                if (!keepInitialOpacity) {
                    b.material.opacity = 0;
                }
                return b;
            });
            const afterObjects = this.collection.objects.map((object) => {
                const b = object.copy;
                b.material.opacity = 1;
                return b;
            });
            const before = new WebaniCollection(beforeObjects);
            const after = new WebaniCollection(afterObjects);
            return this.addAnimation(new WebaniCollectionAnimation({before, after, duration}), asynchronous);
        });
    }

    FadeOut(duration: number = 1000, asynchronous: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            const afterObjects = this.collection.objects.map((object) => {
                const a = object.copy;
                a.material.opacity = 0;
                return a;
            });
            const after = new WebaniCollection(afterObjects);
            return this.addAnimation(new WebaniCollectionAnimation({
                before: this.collection, 
                after, 
                duration
            }), asynchronous);
        });
    }

    Scale(factor: Vector3, duration: number = 1000, asynchronous: boolean = false, backwards: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            const afterObjects = this.collection.objects.map((object) => {
                const after = object.copy;
                after.scaleBy(factor);
                return after;
            });
            const after = new WebaniCollection(afterObjects);
            return this.addAnimation(new WebaniCollectionAnimation({
                before: this.collection, 
                after, 
                duration, 
                backwards
            }), asynchronous);
        });
    }

    ZoomIn(duration: number = 1000, asynchronous: boolean = false) {
        return this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous, true);
    }

    ZoomOut(duration: number = 1000, asynchronous: boolean = false) {
        this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous);
        return this.FadeOut(duration, asynchronous);
    }

    ChangeColor(newColor: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            const afterObjects = this.collection.objects.map(obj => {
                const copy = obj.copy;
                copy.material.color = newColor;
                return copy;
            });
            const after = new WebaniCollection(afterObjects);
            return this.addAnimation(new WebaniCollectionAnimation({
                before: this.collection, 
                after, 
                duration
            }), asynchronous);
        });
    }

    TransformInto(after: RenderableObject, duration: number = 800, asynchronous: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            after = new RenderedGroupNode(after);
            return this.addAnimation(new WebaniCollectionAnimation({
                before: this.collection, 
                after: after.collection, 
                duration: duration
            }), asynchronous);
        });
    }

    MoveCenterTo(position: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            return this.addAnimation(new WebaniCollectionAnimation({
                before: this.collection, 
                after: this.collection.copyCenteredAt(position), 
                duration
            }), asynchronous);
        });
    }

    Move(offset: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        const newCenter = VectorUtils.add(this.collection.center, offset)
        return this.MoveCenterTo(newCenter, duration, asynchronous);
    }

    Rotate(rotation: Vector3, duration: number = 1000, center?: Vector3, asynchronous: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode, parent) {
            const afterObjects = this.collection.objects.map(obj => {
                const a = obj.copy;
                const rotationalCenter = center || parent?.center;
                a.rotate(rotation, rotationalCenter);
                return a;
            });
            const after = new WebaniCollection(afterObjects);
            return this.addAnimation(new WebaniCollectionAnimation({
                before: this.collection, 
                after, 
                duration
            }), asynchronous);
        });
    }

    FadeInDelayed(duration: number = 1000, keepInitialOpacity: boolean = false) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            const beforeObjects = this.collection.objects.map((object) => {
                const b = object.copy;
                if (!keepInitialOpacity) {
                    b.material.opacity = 0;
                }
                return b;
            });
            let before = new WebaniCollection(beforeObjects);
            const objectDuration = duration / this.collection.objects.length;
            const after = before.copy;
            for (const i in after._objects) {
                after._objects[i].material.opacity = 1;
                const afterCollection = after.copy;
                this.addAnimation(new WebaniCollectionAnimation({
                    before,
                    after: afterCollection, 
                    duration: objectDuration, 
                    interpolationFunction: WebaniInterpolatedAnimation.lerp
                }));
                before = afterCollection;
            }
            return this;
        });
    }

    Wait(duration: number) {
        return this.constructAnimation(function(this: RenderedGroupNode) {
            return this.addAnimation(new WebaniCollectionAnimation({
                before: this.collection, 
                after: this.collection, 
                duration: duration
            }));
        });
    }
}