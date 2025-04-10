import { RenderedCollection } from "../animations/rendered-collection.class";
import { VectorUtils } from "../util/vectors/vector.utils";
import { Vector3 } from "../util/vectors/vector3.type";
import { ObjectLike } from "./object-like.type";
import { WanimPolygonObject } from "../polygon/wanim-polygon.class";
import { WanimPrimitiveObject } from "./wanim-primitive-object.class";

export class WanimCollection {
    _objects: WanimPrimitiveObject[];
    _keepRotationCenters: boolean;

    constructor(objects: ObjectLike | ObjectLike[], keepRotationCenters = false) {
        if (objects instanceof WanimCollection) { 
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

    copyCenteredAt(newCenter: Vector3): WanimCollection {
        const copy = this.copy;
        const center = this.center;

        copy._objects = copy._objects.map((obj) => {
            const a = obj.copy;
            a.filledPoints = a.filledPoints.map((point) => {
                return VectorUtils.add(point, VectorUtils.subtract(newCenter, center));
            });
            a.holes = a.holes.map((hole) => {
                return hole.map((point) => {
                    return VectorUtils.add(point, VectorUtils.subtract(newCenter, center));
                });
            });
            return a;
        });

        return copy;
    }

    get copy(): WanimCollection {
        return new WanimCollection(this._objects.map((obj) => obj.copy), this._keepRotationCenters);
    }

    get center(): Vector3 {
        return VectorUtils.center(this._objects.map((obj) => obj.center));
    }

    add(...newObjects: ObjectLike[]): number {
        for (const object of newObjects) {
            if (object instanceof WanimPolygonObject) {
                this._objects.push(object.copy);
            } else if (object instanceof WanimCollection) {
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

    remove(object: WanimPolygonObject): this {
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