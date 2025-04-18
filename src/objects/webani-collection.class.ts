import { RenderedGroupNode } from "../animations/rendered-group-node.class";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { RenderableObject } from "../types/renderable-object.type";
import { WebaniPolygon } from "../polygon/webani-polygon.class";
import { WebaniPrimitiveObject } from "./webani-primitive-object.class";
import { WebaniCollectionAnimation } from "../animations/webani-collection-animation.class";
import { WebaniTransformable } from "./webani-transformable.class";

export class WebaniCollection extends WebaniTransformable {
    _objects: WebaniPrimitiveObject[];
    
    constructor(objects: RenderableObject | RenderableObject[]) {
        super();
        this._objects = [];
        if (objects instanceof WebaniCollection) { 
            return objects;
        }
        if (Array.isArray(objects)) {
            this.add(...objects);
        } else {
            this.add(objects);
        }
    }

    animationClass = WebaniCollectionAnimation;

    copyCenteredAt(newCenter: Vector3): WebaniCollection {
        const copy = this.copy;
        const center = this.center;
        copy._objects = copy._objects.map((obj) => obj.copyCenteredAt(VectorUtils.add(obj.center, VectorUtils.subtract(newCenter, center))));
        return copy;
    }

    get copy(): WebaniCollection {
        return new WebaniCollection(this._objects.map((obj) => obj.copy));
    }

    get localCenter(): Vector3 {
        return VectorUtils.center(this._objects.map((obj) => obj.localCenter));
    }

    get center(): Vector3 {
        return VectorUtils.center(this._objects.map((obj) => obj.center));
    }

    get objects(): WebaniPrimitiveObject[] { 
        return this._objects.map(obj => {
            const copy = obj.copy;
            copy.extraTransforms.push(this.completeTransform, ...this.completeExtraTransforms);
            return obj;
        });
    }

    add(...newObjects: RenderableObject[]): number {
        for (const object of newObjects) {
            if (object instanceof WebaniPrimitiveObject) {
                this._objects.push(object);
            } else if (object instanceof WebaniCollection) {
                this._objects.push(...object._objects);
            } else if (object instanceof RenderedGroupNode) {
                this._objects.push(...object.collection._objects);
            }
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
}