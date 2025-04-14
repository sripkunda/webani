import { WorldTransform } from "../types/world-transform.type";
import { Vector3 } from "../types/vector3.type";
import { VectorUtils } from "../util/vector.utils";
import { CompleteWorldTransform } from "../types/complete-world-transform.type";

export abstract class WebaniTransformable {
    transform: WorldTransform = {
            position: [0, 0, 0],
            scale: [1, 1, 1],
            rotation: [0, 0, 0],
    };
    extraTransforms: WorldTransform[] = [];

    constructor(position: Vector3 = [0, 0, 0], rotation: Vector3 = [0, 0, 0], scale: Vector3 = [1, 1, 1], rotationalCenter?: Vector3, extraTransforms: WorldTransform[] = []) {
        this.transform.position = position;
        this.transform.rotation = rotation;
        this.transform.scale = scale;
        this.transform.rotationCenter = rotationalCenter;
        this.extraTransforms = extraTransforms;        
    }

    get completeTransform(): CompleteWorldTransform { 
        return this.fillCenterInTransform(this.transform);
    }

    get completeExtraTransforms(): CompleteWorldTransform[] { 
        return this.extraTransforms.map(t => this.fillCenterInTransform(t));
    }

    fillCenterInTransform(transform: WorldTransform): CompleteWorldTransform { 
        return {
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
            rotationCenter: transform.rotationCenter || this.center,
        }
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
                rotationCenter: center
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
}