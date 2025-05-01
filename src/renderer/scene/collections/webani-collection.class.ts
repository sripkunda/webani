import { VectorUtils } from "../../util/vector.utils";
import { WebaniPrimitiveObject } from "../webani-primitive-object.class";
import { WebaniTransformable } from "../webani-transformable.class";
import { WebaniCollectionAnimation } from "./webani-collection-animation.class";

/**
 * Represents a collection of `WebaniTransformable` objects. 
 * A `WebaniCollection` allows grouping multiple transformable objects together 
 * and provides methods for manipulating, accessing, and animating these objects.
 * 
 * Collections can be treated as single objects in an animation context but allow 
 * for complex transformations and behaviors by containing multiple objects.
 * 
 * @template T The type of transformable objects contained in the collection.
 */
export class WebaniCollection<T extends WebaniTransformable> extends WebaniTransformable {
    /**
     * The internal array of objects that belong to this collection.
     * 
     * @protected
     * @type {T[]}
     */
    protected _objectArray: T[];

    /**
     * Creates a new `WebaniCollection` instance containing one or more transformable objects.
     * If a `WebaniCollection` is passed, it simply returns that collection.
     * 
     * @param {T[] | T} objects - A single transformable object or an array of transformable objects to be included in the collection.
     */
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

    /**
     * The animation class used for animating collections.
     * 
     * @type {typeof WebaniCollectionAnimation}
     */
    animationClass = WebaniCollectionAnimation;

    /**
     * Creates a shallow copy of the collection, including a shallow copy of each contained object.
     * 
     * @returns {this} A new instance of `WebaniCollection` with shallow copies of the objects.
     */
    get shallowCopy(): this { 
        const clone = super.shallowCopy as this;
        clone._objectArray = this._objectArray.map(x => x.shallowCopy); 
        return clone;
    }

    /**
     * Gets the array of objects contained in the collection.
     * 
     * @returns {T[]} The array of objects in the collection.
     */
    get objectArray(): T[] {
        return [...this._objectArray];
    }
    
    /**
     * Sets the array of objects contained in the collection.
     * 
     * @param {T[]} value - The array of objects to set in the collection.
     */
    set objectArray(value: T[]) { 
        this._objectArray = value;
    }

    /**
     * Calculates the local center of the collection by averaging the local centers of the contained objects.
     * 
     * @returns {Vector} The local center of the collection.
     */
    get localCenter()  {
        return VectorUtils.center(this.flatObjects.map(x => x.localCenter));
    }

    /**
     * Calculates the center of the collection by averaging the global centers of the contained objects.
     * 
     * @returns {Vector} The global center of the collection.
     */
    get center() {
        return VectorUtils.center(this.flatObjects.map(x => x.center));
    }

    /**
     * Recursively flattens the collection, including all nested collections, into a single array of objects.
     * 
     * @returns {T[]} A flat list of all objects contained in the collection, including those in nested collections.
     */
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

    /**
     * Adds one or more objects to the collection.
     * 
     * @param {...T[]} newObjects - The objects to add to the collection.
     * @returns {number} The index of the last object added.
     */
    add(...newObjects: T[]): number {
        this._objectArray.push(...newObjects);
        return this._objectArray.length - 1;
    }

    /**
     * Removes the object at the specified index from the collection.
     * 
     * @param {number} index - The index of the object to remove.
     * @returns {this} The collection instance after removing the object.
     */
    removeIndex(index: number): this {
        this._objectArray.splice(index, 1);
        return this;
    }

    /**
     * Maps over each object in the collection and applies a function to transform them.
     * This returns a new `WebaniCollection` with the transformed objects.
     * 
     * @param {(object: T) => T} mapFunction - The function to apply to each object in the collection.
     * @returns {WebaniCollection<T>} A new collection with the transformed objects.
     */
    mapObjects(mapFunction: (object: T) => T) { 
        const copy = this.shallowCopy; 
        copy.objectArray = copy.objectArray.map(object => {
            if (object instanceof WebaniPrimitiveObject) {
                return mapFunction(object);
            } else if (object instanceof WebaniCollection) {
                return object.mapObjects(mapFunction);
            } else {
                return object;
            }
        })
        return copy;
    }
}
