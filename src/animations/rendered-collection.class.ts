import { ObjectLike } from "../types/object-like.type";
import { WebaniCollection } from "../objects/webani-collection.class";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { AnimationSet } from "./animation-set.class";
import { WebaniCollectionAnimation } from "./webani-collection-animation.class";
import { WebaniInterpolatedAnimation } from "./webani-interpolated-animation.class";
import { WebaniPrimitiveObject } from "../objects/webani-primitive-object.class";
import { WebaniAnimation } from "./webani-animation.class";

export class RenderedCollection extends WebaniAnimation {
    private _collection: WebaniCollection;
    private keepRotationalCentersOverride?: boolean;
    animationSet: AnimationSet;

    constructor(collection: ObjectLike, keepRotationalCentersOverride?: boolean) {
        super();
        if (collection instanceof RenderedCollection) return collection;
        this._collection = collection instanceof WebaniPrimitiveObject ? new WebaniCollection(collection) : collection;
        this.keepRotationalCentersOverride = keepRotationalCentersOverride;
        this.animationSet = new AnimationSet();
    }

    done(t: number) { return this.animationSet.done(t) };
    frame(t: number) { return this.animationSet.frame(t) };

    get collection(): WebaniCollection {
        return new WebaniCollection(this._collection, this._keepRotationCenters);
    }

    onAnimationAdded(handler: (animation: WebaniCollectionAnimation, asynchronous: boolean) => void): void {
        this.animationSet.onAnimationAdded(handler);
    }

    get animated(): boolean {
        return this.animationSet.length > 0;
    }

    get _keepRotationCenters(): boolean {
        return this.keepRotationalCentersOverride !== undefined ? this.keepRotationalCentersOverride : this._collection._keepRotationCenters;
    }

    _addAnimation(animation: WebaniCollectionAnimation, asynchronous: boolean = false) {
        if (animation.duration > 0) {
            this.animationSet.addAnimation(animation, asynchronous);
        }
        this._collection = animation.after;
        return this;
    }

    Hide(): void {
        this.FadeOut(0);
    }

    SetRotation(angle: Vector3, center?: Vector3) { 
        return this.Rotate(angle, 0, center);
    }

    SetCenterPosition(position: Vector3) {
        return this.MoveCenterTo(position, 0);
    }

    FadeIn(duration: number = 1000, keepInitialOpacity: boolean = false, asynchronous: boolean = false) {
        const beforeObjects = this.collection._objects.map((object) => {
            const b = object.copy;
            if (!keepInitialOpacity) {
                b.material.opacity = 0;
            }
            return b;
        });
        const afterObjects = this.collection._objects.map((object) => {
            const b = object.copy;
            b.material.opacity = 1;
            return b;
        });
        const before = new WebaniCollection(beforeObjects, this._keepRotationCenters);
        const after = new WebaniCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WebaniCollectionAnimation(before, after, duration), asynchronous);
    }

    FadeOut(duration: number = 1000, asynchronous: boolean = false) {
        const afterObjects = this.collection._objects.map((object) => {
            const a = object.copy;
            a.material.opacity = 0;
            return a;
        });
        const after = new WebaniCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WebaniCollectionAnimation(this.collection, after, duration), asynchronous);
    }

    Scale(factor: Vector3, duration: number = 1000, asynchronous: boolean = false, backwards: boolean = false) {
        const afterObjects = this.collection._objects.map((object) => {
            const after = object.copy;
            after.scaleBy(factor);
            return after;
        });
        const after = new WebaniCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WebaniCollectionAnimation(this.collection, after, duration, backwards), asynchronous);
    }

    ZoomIn(duration: number = 1000, asynchronous: boolean = false) {
        this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous, true);
        return this;
    }

    ZoomOut(duration: number = 1000, asynchronous: boolean = false) {
        this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous);
        return this.FadeOut(duration, asynchronous);
    }

    ChangeColor(newColor: Vector3, duration: number = 1000, asynchronous: boolean = false) { 
        const afterObjects = this.collection._objects.map(obj => {
            const copy = obj.copy;
            copy.material.color = newColor;
            return copy;
        });
        const after = new WebaniCollection(afterObjects);
        return this._addAnimation(new WebaniCollectionAnimation(this.collection, after, duration), asynchronous)
    }

    TransformInto(after: ObjectLike, duration: number = 800, asynchronous: boolean = false) {
        after = new RenderedCollection(after);
        return this._addAnimation(new WebaniCollectionAnimation(this.collection, after.collection, duration, false, true), asynchronous);
    }

    MoveCenterTo(position: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        return this._addAnimation(new WebaniCollectionAnimation(this.collection, this.collection.setAnchor(position), duration), asynchronous);
    }

    Move(offset: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        const newCenter = VectorUtils.add(this.collection.center, offset)
        return this.MoveCenterTo(newCenter, duration, asynchronous);
    }

    Rotate(rotation: Vector3, duration: number = 1000, center?: Vector3, asynchronous: boolean = false) {
        const afterObjects = this.collection._objects.map(obj => {
            const a = obj.copy;
            a.rotate(rotation);
            return a;
        });
        const after = new WebaniCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WebaniCollectionAnimation(this.collection, after, duration), asynchronous);
    }

    FadeInDelayed(duration: number = 1000, keepInitialOpacity: boolean = false) {
        const beforeObjects = this.collection._objects.map((object) => {
            const b = object.copy;
            if (!keepInitialOpacity) {
                b.material.opacity = 0;
            }
            return b;
        });
        let before = new WebaniCollection(beforeObjects, this._keepRotationCenters);
        const objectDuration = duration / this.collection._objects.length;
        const after = before.copy;
        for (const i in after._objects) {
            after._objects[i].material.opacity = 1;
            const afterCollection = after.copy;
            this._addAnimation(new WebaniCollectionAnimation(before, afterCollection, objectDuration, false, false, WebaniInterpolatedAnimation.lerp));
            before = afterCollection;
        }
        return this;
    }

    Wait(duration: number) {
        return this._addAnimation(new WebaniCollectionAnimation(this.collection, this.collection, duration));
    }
}