import { RenderedCollection } from "../animations/rendered-collection.class";
import { VectorUtils } from "../util/vectors/vector.utils";
import { Vector3 } from "../util/vectors/vector3.type";
import { ObjectLike } from "./object-like.type";
import { LorentzPolygon } from "../polygon/lorentz-polygon.class";
import { LorentzPrimitiveObject } from "./lorentz-primitive-object.class";

export class LorentzCollection {
    _objects: LorentzPrimitiveObject[];
    _keepRotationCenters: boolean;

    constructor(objects: ObjectLike | ObjectLike[], keepRotationCenters = false) {
        if (objects instanceof LorentzCollection) { 
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

    setAnchor(newCenter: Vector3): LorentzCollection {
        const copy = this.copy;
        const center = this.center;
        copy._objects = copy._objects.map((obj) => obj.copyCenteredAt(VectorUtils.add(obj.center, VectorUtils.subtract(newCenter, center))));
        return copy;
    }

    get copy(): LorentzCollection {
        return new LorentzCollection(this._objects.map((obj) => obj.copy), this._keepRotationCenters);
    }

    get center(): Vector3 {
        return VectorUtils.center(this._objects.map((obj) => obj.center));
    }

    add(...newObjects: ObjectLike[]): number {
        for (const object of newObjects) {
            if (object instanceof LorentzPolygon) {
                this._objects.push(object.copy);
            } else if (object instanceof LorentzCollection) {
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

    remove(object: LorentzPolygon): this {
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