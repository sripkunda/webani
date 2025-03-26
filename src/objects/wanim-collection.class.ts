import { WanimObject } from "./wanim-object.class";

export class WanimCollection {
    _objects: WanimObject[];
    _keepRotationCenters: boolean;

    constructor(objects: WanimObject | WanimObject[] | WanimCollection | WanimCollection[], keepRotationCenters = false) {
        this._objects = [];
        this._keepRotationCenters = keepRotationCenters;
        if (Array.isArray(objects)) {
            this.add(...objects);
        } else {
            this.add(objects);
        }
    }

    copyCenteredAt(newCenter: number[]): WanimCollection {
        newCenter = WanimObject._convertPointTo3D(newCenter);
        const copy = this.copy;
        const center = this.center;

        copy._objects = copy._objects.map((obj) => {
            const a = obj.copy;
            a.filledPoints = a.filledPoints.map((point) => {
                return WanimObject._add(point, WanimObject._subtract(newCenter, center));
            });
            a.holes = a.holes.map((hole) => {
                return hole.map((point) => {
                    return WanimObject._add(point, WanimObject._subtract(newCenter, center));
                });
            });
            return a;
        });

        return copy;
    }

    get copy(): WanimCollection {
        return new WanimCollection(this._objects.map((obj) => obj.copy), this._keepRotationCenters);
    }

    get center(): number[] {
        return WanimObject._center(this._objects.map((obj) => obj.center));
    }

    add(...newObjects: any[]): number {
        for (const object of newObjects) {
            if (object instanceof WanimObject) {
                this._objects.push(object.copy);
            } else if (object instanceof WanimCollection) {
                this._objects.push(...object.copy._objects);
            }
        }

        if (!this._keepRotationCenters) {
            this._updateObjectCenters();
        }

        return this._objects.length - 1;
    }

    remove(object: WanimObject): this {
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