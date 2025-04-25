import { WorldTransform } from "../types/world-transform.type";
import { Vector3 } from "../types/vector3.type";
import { VectorUtils } from "../util/vector.utils";
import { CompleteWorldTransform } from "../types/complete-world-transform.type";

export type WebaniTransformableOptions = {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    rotationalCenter?: Vector3;
    extraTransforms?: WorldTransform[];
};

export abstract class WebaniTransformable {
    transform: WorldTransform = {
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
    };
    extraTransforms: WorldTransform[] = [];

    constructor({
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        rotationalCenter,
        extraTransforms = [],
    }: WebaniTransformableOptions = {}) {
        this.transform.position = position;
        this.transform.rotation = rotation;
        this.transform.scale = scale;
        this.transform.rotationalCenter = rotationalCenter;
        this.extraTransforms = extraTransforms;
    }

    get completeTransform(): CompleteWorldTransform {
        return this.fillCenterInTransform(this.transform);
    }

    get completeExtraTransforms(): CompleteWorldTransform[] {
        return this.extraTransforms.map(t => this.fillCenterInTransform(t));
    }

    get extraTransformsCopy(): WorldTransform[] {
        return [...this.extraTransforms.map(x => this.copyTransform(x))];
    }

    get transformCopy(): WorldTransform {
        return this.copyTransform(this.transform);
    }

    get shallowCopy() { 
        const clone = Object.create(this.constructor.prototype);
        Object.assign(clone, this); 
        clone.extraTransforms = this.extraTransformsCopy;
        clone.transform = this.transformCopy;
        return clone;
    }

    abstract get localCenter(): Vector3;
    abstract get center(): Vector3;

    translate(offset: Vector3): void {
        this.transform.position = VectorUtils.add(this.transform.position, offset);
    }

    rotate(offset: Vector3, center?: Vector3): void {
        if (!center) {
            this.transform.rotation = VectorUtils.add(this.transform.rotation, offset);
        } else {
            this.extraTransforms.push({
                position: [0, 0, 0],
                scale: [1, 1, 1],
                rotation: offset,
                rotationalCenter: center
            });
        }
    }

    scaleBy(factor: Vector3): void {
        this.transform.scale = [
            this.transform.scale[0] * factor[0],
            this.transform.scale[1] * factor[1],
            this.transform.scale[2] * factor[2]
        ];
    }

    private fillCenterInTransform(transform: WorldTransform): CompleteWorldTransform {
        return {
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
            rotationalCenter: transform.rotationalCenter || this.center,
        };
    }

    private copyTransform(transform: WorldTransform) { 
        return {
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
            rotationalCenter: transform.rotationalCenter,
        }
    }
}