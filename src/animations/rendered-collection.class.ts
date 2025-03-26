import { WanimCollection } from "../objects/wanim-collection.class";
import { WanimObject } from "../objects/wanim-object.class";
import { Vector } from "../util/vector.type";
import { AnimationSet } from "./animation-set.class";
import { WanimCollectionAnimation } from "./wanim-collection-animation.class";
import { WanimInterpolatedAnimationBase } from "./wanim-interpolated-animation-base.class";

function getAllRenderedCollections(obj: Record<string, any>): RenderedCollection[] {
    let values: any[] = [];
  
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] instanceof RenderedCollection){
            values.push(obj[key]);   
        }
        else if (obj[key] instanceof Object) {
          values = values.concat(getAllRenderedCollections(obj[key])); 
        }
      }
    }
  
    return values;
}

export class RenderedCollection {
    _collection: WanimCollection;
    _keepRotationalCentersOverride?: boolean;
    _animations: AnimationSet;

    [key: string]: any;

    constructor(collection: WanimCollection | WanimObject, keepRotationalCentersOverride?: boolean) {
        this._collection = collection instanceof WanimObject ? new WanimCollection(collection) : collection;
        this._keepRotationalCentersOverride = keepRotationalCentersOverride;
        this._animations = new AnimationSet();
    }

    static Group(object: object, parentCollection?: RenderedCollection, subcollectionSlice?: (object: RenderedCollection) => { start: number; count: number }) {
        if (object instanceof RenderedCollection) {
            if (parentCollection && subcollectionSlice) {
                const slice = subcollectionSlice(object);
                if (slice.count < 1) return object;
                object.onAnimationAdded((animation, asynchronous) => {
                    const beforeObjects = parentCollection.collection.copy._objects;
                    const afterObjects = parentCollection.collection.copy._objects;
                    beforeObjects.splice(slice.start, slice.count, ...animation._before._objects);
                    afterObjects.splice(slice.start, slice.count, ...animation._after._objects);
                    const beforeCollection = new WanimCollection(beforeObjects, true);
                    const afterCollection = new WanimCollection(afterObjects, true);
                    parentCollection._addAnimation(new WanimCollectionAnimation(beforeCollection, afterCollection, animation.duration, animation.backwards, animation.interpolationFunction), asynchronous);
                });
            }
            return object;
        }
        if (!(object instanceof Object)) return;
          
        const renderedCollections = getAllRenderedCollections(object)
        const collections = renderedCollections.map(x => x.collection);
        const indices: number[] = [];
        let sum = 0;
        for (let collection of collections) { 
            indices.push(sum);
            sum += collection._objects.length;
        }
        const getSubcollectionSlice = (object: RenderedCollection) => {
            let i = renderedCollections.indexOf(object);
            if (i < 0) 
                return {
                    start: -1,
                    count: 0
                };
            const start = indices[i];
            const end =  i + 1 >= indices.length ? renderedCollection.collection._objects.length : indices[i + 1];
            return {
                start: start,
                count: end - start
            }
        }
        
        const groupedCollection = new WanimCollection(collections);
        const renderedCollection = new RenderedCollection(groupedCollection, false);

        for (let key in object) {
            renderedCollection[key] = RenderedCollection.Group(object[key], parentCollection || renderedCollection, subcollectionSlice || getSubcollectionSlice);
        }
        return renderedCollection;
    }

    get collection(): WanimCollection {
        return new WanimCollection(this._collection, this._keepRotationCenters);
    }

    onAnimationAdded(handler: (animation: WanimCollectionAnimation, asynchronous: boolean) => void): void {
        this._animations.onAnimationAdded(handler);
    }

    get animated(): boolean {
        return this._animations.length > 0;
    }

    get _keepRotationCenters(): boolean {
        return this._keepRotationalCentersOverride !== undefined ? this._keepRotationalCentersOverride : this._collection._keepRotationCenters;
    }

    _addAnimation(animation: WanimCollectionAnimation, asynchronous: boolean = false): RenderedCollection {
        this._animations.addAnimation(animation, asynchronous);
        this._collection = animation.after;
        return this;
    }

    Hide(): void {
        this.FadeOut(0);
    }

    PositionCenterAt(position: number[]): RenderedCollection {
        return this.MoveCenterTo(position, 0);
    }

    FadeIn(duration: number = 1000, keepInitialOpacity: boolean = false, asynchronous: boolean = false): RenderedCollection {
        const beforeObjects = this.collection._objects.map((object) => {
            let b = object.copy;
            if (!keepInitialOpacity) {
                b.opacity = 0;
            }
            return b;
        });
        const afterObjects = this.collection._objects.map((object) => {
            let b = object.copy;
            b.opacity = 1;
            return b;
        });
        const before = new WanimCollection(beforeObjects, this._keepRotationCenters);
        const after = new WanimCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WanimCollectionAnimation(before, after, duration), asynchronous);
    }

    FadeOut(duration: number = 1000, asynchronous: boolean = false): RenderedCollection {
        const afterObjects = this.collection._objects.map((object) => {
            let a = object.copy;
            a.opacity = 0;
            return a;
        });
        const after = new WanimCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration), asynchronous);
    }

    Scale(factor: number[], duration: number = 1000, asynchronous: boolean = false, backwards: boolean = false): RenderedCollection {
        factor = WanimObject._convertPointTo3D(factor);
        let center = this.collection.center;
        const afterObjects = this.collection._objects.map((object) => {
            let after = object.copy;
            after.filledPoints = after.filledPoints.map((x) => x.map((y, i) => (y - center[i]) * factor[i] + center[i]));
            after.holes = after.holes.map(points => points.map((x) => x.map((y, i) => (y - center[i]) * factor[i] + center[i])));
            return after;
        });
        const after = new WanimCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration, backwards));
    }

    ZoomIn(duration: number = 1000, asynchronous: boolean = false): RenderedCollection {
        this.Scale([1 / 10, 1 / 10], duration, asynchronous, true);
        return this;
    }

    ZoomOut(duration: number = 1000, asynchronous: boolean = false): RenderedCollection {
        this.Scale([1 / 10, 1 / 10], duration, asynchronous);
        return this.FadeOut(duration, asynchronous);
    }

    ChangeColor(newColor: Vector, duration: number = 1000, asynchronous: boolean = false) { 
        const afterObjects = this.collection._objects.map(obj => {
            let copy = obj.copy;
            copy.color = newColor;
            return copy;
        });
        const after = new WanimCollection(afterObjects);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration), asynchronous)
    }

    TransformInto(after: RenderedCollection, duration: number = 800, asynchronous: boolean = false): RenderedCollection {
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after.collection, duration), asynchronous);
    }

    MoveCenterTo(position: number[], duration: number = 1000, asynchronous: boolean = false): RenderedCollection {
        position = WanimObject._convertPointTo3D(position);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, this.collection.copyCenteredAt(position), duration), asynchronous);
    }

    Move(offset: number[], duration: number = 1000, asynchronous: boolean = false): RenderedCollection {
        offset = WanimObject._convertPointTo3D(offset);
        const newCenter = WanimObject._add(this.collection.center, offset)
        return this.MoveCenterTo(newCenter, duration, asynchronous);
    }

    Rotate(angle: number, duration: number = 1000, asynchronous: boolean = false): RenderedCollection {
        const afterObjects = this.collection._objects.map(obj => {
            const a = obj.copy;
            a.rotation = [0, 0, angle];
            return a;
        });
        const after = new WanimCollection(afterObjects, this._keepRotationCenters);
        return this._addAnimation(new WanimCollectionAnimation(this.collection, after, duration), asynchronous);
    }

    FadeInDelayed(duration: number = 1000, keepInitialOpacity: boolean = false): RenderedCollection {
        const beforeObjects = this.collection._objects.map((object) => {
            let b = object.copy;
            if (!keepInitialOpacity) {
                b.opacity = 0;
            }
            return b;
        });
        let before = new WanimCollection(beforeObjects, this._keepRotationCenters);
        const objectDuration = duration / this.collection._objects.length;
        const after = before.copy;
        for (let i in after._objects) {
            after._objects[i].opacity = 1;
            const afterCollection = after.copy;
            this._addAnimation(new WanimCollectionAnimation(before, afterCollection, objectDuration, false, WanimInterpolatedAnimationBase.lerp));
            before = afterCollection;
        }
        return this;
    }

    Wait(duration: number): RenderedCollection {
        return this._addAnimation(new WanimCollectionAnimation(this.collection, this.collection, duration));
    }
}