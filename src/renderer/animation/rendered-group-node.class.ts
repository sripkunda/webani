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

/**
 * A node-based wrapper around `WebaniCollection`, extending `WebaniAnimation` to provide
 * hierarchical and composable animation capabilities for objects.
 *
 * Each `RenderedGroupNode` may contain child nodes, forming a tree structure of renderable,
 * animatable objects. This allows coordinated animations, transformations, and styling across user-defined scene graphs.
 */
export class RenderedGroupNode extends WebaniAnimation {
    /**
     * Collection of WebaniTransformable objects represented by this node.
     */
    private _collection: WebaniCollection<WebaniTransformable>;

    /**
     * Keys identifying child nodes of this group.
     */
    private childKeys: (string | number | symbol)[] = [];

    /**
     * Parent node, if this node is part of a hierarchy.
     */
    private parent?: RenderedGroupNode;

    /**
     * Animation set used to track and control animations applied to this group.
     */
    animationSet: AnimationSet;

    
    [key: (string | number | symbol)]: any;

    /**
     * Constructs a new `RenderedGroupNode`.
     * @param collection Optional renderable object or another group node to base this node on.
     */
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

    /**
     * Recursively constructs a `RenderedGroupNode` hierarchy from a nested object structure.
     * @param object A nested object to convert into a `RenderedGroupNode`.
     * @returns A root `RenderedGroupNode` representing the object structure.
     */
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

    /**
     * Returns whether all animations in this node's animation set are complete at a given time.
     * @param t The current timestamp.
     */
    done(t: number) {
        return this.animationSet.done(t); 
    };

    /**
     * Returns the `WebaniCollection` frame at the given time.
     * @param t The time in milliseconds
     */
    frame(t: number) {
        return this.animationSet.frame(t);
    };

    /**
     * The collection which this `RenderedGroupNode` object wraps.
     */
    get collection(): WebaniCollection<WebaniTransformable> {
        return this._collection;
    }

    /**
     * Recursively determines the leaf nodes in the tree formed by the RenderedGroupNode
     */
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

    /**
     * Determines if the current node is a leaf node.
     */
    get isLeaf(): boolean { 
        return this.childKeys.length < 1;
    }

    /**
     * Registers a callback to be invoked whenever a new animation is added.
     * @param handler Callback receiving the newly added animation and whether it is asynchronous.
     */
    onAnimationAdded(handler: (animation: WebaniCollectionAnimation, asynchronous: boolean) => void): void {
        this.animationSet.onAnimationAdded(handler);
    }

    /**
     * Determines whether the node has any animation data.
     */
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

    /**
     * Immediately hides the entire `RenderedGroupNode`. No animations are queued.
     */
    Hide(): void {
        this.FadeOut(0);
    }

    /**
     * Immediately sets the rotation of the entire `RenderedGroupNode`. No animations are queued.
     */
    OverrideRotation(rotation: Vector3, center?: Vector3) { 
        return this.SetRotation(rotation, 0, center);
    }

    /**
     * Immediately sets the position of the entire `RenderedGroupNode`. No animations are queued.
     */
    OverridePosition(position: Vector3) {
        return this.SetPosition(position, 0);
    }

    /**
     * Fades in all contained objects over a given duration.
     * @param duration Duration of the animation in milliseconds.
     * @param keepInitialOpacity If true, respects original opacity before fading in.
     * @param asynchronous If true, the animation is asynchronous
     */
    FadeIn(duration: number = 1000, keepInitialOpacity: boolean = false, asynchronous: boolean = false) {
        const before = this.collection.mapObjects((object) => {
            const b = object.shallowCopy;
            if (!keepInitialOpacity && b instanceof WebaniPrimitiveObject) {
                b.material.opacity = 0;
            }
            return b;
        });
        const after = this.collection.mapObjects((object) => {
            const b = object.shallowCopy;
            if (b instanceof WebaniPrimitiveObject) {
                b.material.opacity = 1;
            } else { 
                
            }
            return b;
        });
        return this.addAnimation(new WebaniCollectionAnimation({before, after, duration}), asynchronous);
    }

    /**
     * Fades out all contained objects over a given duration.
     * @param duration Duration of the animation in milliseconds.
     * @param asynchronous If true, the animation is asynchronous
     */
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

    /**
     * Scales all objects in the group by the given factor.
     * @param factor The scale factor on each axis.
     * @param duration Duration of the animation.
     * @param asynchronous If true, the animation is asynchronous.
     * @param backwards If true, the animation plays in reverse.
     */
    Scale(factor: Vector3, duration: number = 1000, asynchronous: boolean = false, backwards: boolean = false) {
        const after = this.collection.mapObjects((object) => {
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

    /**
     * Performs a zoom-in effect using backwards `Scale`.
     * @param duration Duration of the zoom.
     * @param asynchronous If true, the animation is asynchronous.
     */
    ZoomIn(duration: number = 1000, asynchronous: boolean = false) {
        return this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous, true);
    }

    /**
     * Performs a zoom-out effect using `Scale` followed by a `FadeOut`.
     * @param duration Duration of the zoom.
     * @param asynchronous If true, the animation is asynchronous.
     */
    ZoomOut(duration: number = 1000, asynchronous: boolean = false) {
        this.Scale([1 / 100, 1 / 100, 1 / 100], duration, asynchronous);
        return this.FadeOut(duration, asynchronous);
    }

    /**
     * Animates an interpolated change of color for all `WebaniPrimitiveObjects` in the node with the provided duration
     * @param newColor RGB values of the new color.
     * @param duration Duration of the transition animation.
     * @param asynchronous If true, the animation is asynchronous.
     */
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

    /**
     * Morphs this node into another `RendereableObject`. This is a very powerful method which can be utilized to recreate many 
     * of the other animation methods available to `RenderedGroupNode` objects.
     * @param after Target object.
     * @param duration Duration of the transformation.
     * @param asynchronous If true, the animation is asynchronous.
     */
    TransformInto(after: RenderableObject, duration: number = 800, asynchronous: boolean = false) {
        after = new RenderedGroupNode(after);
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after: after.collection, 
            duration: duration
        }), asynchronous);
    }

    /**
     * Rotates the node to a specific rotation.
     * @param rotation The target rotation.
     * @param duration Duration of the animation.
     * @param center Optional center for the rotation. The default is the center of the contained `WebaniCollection`
     * @param asynchronous If true, the animation is asynchronous.
     */
    SetRotation(rotation: Vector3, duration: number = 1000, center?: Vector3, asynchronous: boolean = false) { 
        const after = this.collection.shallowCopy;
        after.setRotation(rotation, center);
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after, 
            duration
        }), asynchronous);
    }

    /**
     * Moves the node to a specific position.
     * @param rotation The target positiopn.
     * @param duration Duration of the animation.
     * @param asynchronous If true, the animation is asynchronous.
     */
    SetPosition(position: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        const after = this.collection.shallowCopy;
        after.setPosition(position)
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after: after, 
            duration
        }), asynchronous);
    }

    /**
     * Moves the node by a specified offset (i.e. a translation).
     * @param rotation The offset to move by
     * @param duration Duration of the animation.
     * @param asynchronous If true, the animation is asynchronous.
     */
    Move(offset: Vector3, duration: number = 1000, asynchronous: boolean = false) {
        const newCenter = VectorUtils.add(this.collection.center, offset)
        return this.SetPosition(newCenter, duration, asynchronous);
    }

    /**
     * Rotates the group by a specified rotation.
     * @param rotation The rotation to perform.
     * @param duration Duration of the animation.
     * @param center Optional center for the rotation. The default is the center of the contained `WebaniCollection`
     * @param asynchronous If true, the animation is asynchronous.
     */
    Rotate(rotation: Vector3, duration: number = 1000, center?: Vector3, asynchronous: boolean = false) {
        const after = this.collection.shallowCopy;
        after.rotate(rotation, center);
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after, 
            duration
        }), asynchronous);
    }

    /**
     * Waits for a specified duration without modifying the object.
     * Useful for sequencing animations.
     * @param duration Wait time in milliseconds.
     */
    Wait(duration: number) {
        return this.addAnimation(new WebaniCollectionAnimation({
            before: this.collection, 
            after: this.collection, 
            duration: duration
        }));
    }
}