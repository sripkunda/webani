import { RenderedGroupNode } from "../renderer/animation/rendered-group-node.class";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { RenderableObject } from "../types/renderable-object.type";
import { WebaniPolygon } from "./webani-polygon.class";
import { WebaniPrimitiveObject } from "../renderer/scene/webani-primitive-object.class";
import { WebaniCollectionAnimation } from "../renderer/animation/webani-collection-animation.class";
import { WebaniTransformable } from "../renderer/scene/webani-transformable.class";

export class WebaniCollection extends WebaniTransformable {
    unresolvedObjects: WebaniPrimitiveObject[];
    
    constructor(objects: RenderableObject | RenderableObject[]) {
        super();
        this.unresolvedObjects = [];
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
        const copy = this.shallowCopy;
        const center = this.center;
        copy.unresolvedObjects = copy.unresolvedObjects.map((obj) => obj.copyCenteredAt(VectorUtils.add(obj.center, VectorUtils.subtract(newCenter, center))));
        return copy;
    }

    get localCenter(): Vector3 {
        return VectorUtils.center(this.unresolvedObjects.map((obj) => obj.localCenter));
    }

    get center(): Vector3 {
        return VectorUtils.center(this.unresolvedObjects.map((obj) => obj.center));
    }

    get shallowCopy(): this { 
        const clone = super.shallowCopy as this;
        clone.unresolvedObjects = this.unresolvedObjects.map(x => x.shallowCopy); 
        return clone;
    }

    get objects(): WebaniPrimitiveObject[] { 
        return this.unresolvedObjects.map(obj => {
            const copy = obj.shallowCopy;
            copy.extraTransforms.push(this.completeTransform, ...this.completeExtraTransforms);
            return copy;
        });
    }

    add(...newObjects: RenderableObject[]): number {
        for (const object of newObjects) {
            if (object instanceof WebaniPrimitiveObject) {
                this.unresolvedObjects.push(object);
            } else if (object instanceof WebaniCollection) {
                this.unresolvedObjects.push(...object.unresolvedObjects);
            } else if (object instanceof RenderedGroupNode) {
                this.unresolvedObjects.push(...object.collection.unresolvedObjects);
            }
        }

        return this.unresolvedObjects.length - 1;
    }

    remove(object: WebaniPolygon): this {
        this.unresolvedObjects = this.unresolvedObjects.filter((x) => x !== object);
        return this;
    }

    removeIndex(index: number): this {
        this.unresolvedObjects.splice(index, 1);
        return this;
    }
}