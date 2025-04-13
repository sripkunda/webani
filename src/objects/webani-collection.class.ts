import { RenderedCollection } from "../animations/rendered-collection.class";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { ObjectLike } from "../types/object-like.type";
import { WebaniPolygon } from "../polygon/webani-polygon.class";
import { WebaniPrimitiveObject } from "./webani-primitive-object.class";
import { WebaniCollectionAnimation } from "../animations/webani-collection-animation.class";

export class WebaniCollection {
    _objects: WebaniPrimitiveObject[];
    _keepRotationCenters: boolean;

    constructor(objects: ObjectLike | ObjectLike[], keepRotationCenters = false) {
        if (objects instanceof WebaniCollection) { 
            return objects;
        }
        this._objects = [];
        this._keepRotationCenters = keepRotationCenters;
        if (Array.isArray(objects)) {
            this.add(...objects);
        } else {
            this.add(objects);
        }
    }

    animationClass = WebaniCollectionAnimation

    setAnchor(newCenter: Vector3): WebaniCollection {
        const copy = this.copy;
        const center = this.center;
        copy._objects = copy._objects.map((obj) => obj.copyCenteredAt(VectorUtils.add(obj.center, VectorUtils.subtract(newCenter, center))));
        return copy;
    }

    get copy(): WebaniCollection {
        return new WebaniCollection(this._objects.map((obj) => obj.copy), this._keepRotationCenters);
    }

    get center(): Vector3 {
        return VectorUtils.center(this._objects.map((obj) => obj.center));
    }

    add(...newObjects: ObjectLike[]): number {
        for (const object of newObjects) {
            if (object instanceof WebaniPolygon) {
                this._objects.push(object.copy);
            } else if (object instanceof WebaniCollection) {
                this._objects.push(...object.copy._objects);
            } else if (object instanceof RenderedCollection) {
                this._objects.push(...object.collection._objects);
            }
        }

        if (!this._keepRotationCenters) {
            this._updateObjectCenters();
        }

        return this._objects.length - 1;
    }

    remove(object: WebaniPolygon): this {
        this._objects = this._objects.filter((x) => x !== object);
        return this;
    }

    removeIndex(index: number): this {
        this._objects.splice(index, 1);
        return this;
    }

    _updateObjectCenters(): void {
        const center = this.center;
        for (const object of this._objects) {
            object.rotationCenter = center;
        }
    }
}