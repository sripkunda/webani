import { WorldTransform } from "../types/world-transform.type";
import { Vector3 } from "../types/vector3.type";
import { VectorUtils } from "../util/vector.utils";
import { CompleteWorldTransform } from "../types/complete-world-transform.type";
import { MatrixUtils } from "../util/matrix.utils";
import { Matrix4 } from "../types/matrix4.type";
import { WebaniInterpolatedAnimation, WebaniInterpolatedAnimationOptions } from "../animation/webani-interpolated-animation.class";

export type WebaniTransformableOptions = {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    rotationalCenter?: Vector3;
    extraTransforms?: WorldTransform[];
    useOriginAsCenter?: boolean;
    scaleCompensation?: boolean;
};

export class WebaniTransformable {
    transform: WorldTransform = {
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
    };
    extraTransforms: WorldTransform[] = [];
    parent?: WebaniTransformable;
    useOriginAsCenter: boolean = false;
    scaleCompensation: boolean = false;
    animationClass?: new (options: WebaniInterpolatedAnimationOptions<WebaniTransformable>) => WebaniInterpolatedAnimation<WebaniTransformable>;

    constructor({
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        rotationalCenter,
        extraTransforms = [],
        useOriginAsCenter = false,
        scaleCompensation = false
    }: WebaniTransformableOptions = {}) {
        this.transform.position = position;
        this.transform.rotation = rotation;
        this.transform.scale = scale;
        this.transform.rotationalCenter = rotationalCenter;
        this.extraTransforms = extraTransforms;
        this.useOriginAsCenter = useOriginAsCenter;
        this.scaleCompensation = scaleCompensation;
    }

    get localCenter(): Vector3 { 
        return [0, 0, 0];
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
        const clone = Object.create(this.constructor.prototype) as this;
        Object.assign(clone, this); 
        clone.extraTransforms = this.extraTransformsCopy;
        clone.transform = this.transformCopy;
        return clone;
    }

    get extraTransformsMatrixWithoutScale(): Matrix4 {
        let matrix = MatrixUtils.identity()
        for (let transform of this.completeExtraTransforms) {
            matrix = MatrixUtils.multiply(
                MatrixUtils.fromTRS(
                    transform.position,
                    transform.rotation,
                    [1, 1, 1],
                    transform.rotationalCenter
                ),
                matrix
            );
        }
        return matrix;
    }

    get modelMatrixWithoutScale(): Matrix4 {
        const transform = this.completeTransform;
        let matrix = MatrixUtils.fromTRS(
            transform.position,
            transform.rotation,
            [1, 1, 1],
            transform.rotationalCenter
        );

        if (this.parent) { 
            matrix = MatrixUtils.multiply(this.parent.modelMatrixWithoutScale, matrix);
        }
        return matrix;
    }

    get modelMatrix(): Matrix4 {
        const transform = this.completeTransform;
        let matrix = MatrixUtils.fromTRS(
            transform.position,
            transform.rotation,
            transform.scale,
            transform.rotationalCenter
        );

        if (this.parent) { 
            matrix = MatrixUtils.multiply(this.scaleCompensation ? this.parent.modelMatrixWithoutScale : this.parent.modelMatrix, matrix);
        }

        for (let transform of this.completeExtraTransforms) {
            matrix = MatrixUtils.multiply(
                MatrixUtils.fromTRS(
                    transform.position,
                    transform.rotation,
                    transform.scale,
                    transform.rotationalCenter
                ),
                matrix
            );
        }
        return matrix;
    }

    get center(): Vector3 { 
        return this.transform.position;
    }

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

    overridePosition(position: Vector3): void {
        this.transform.position = VectorUtils.add(position, VectorUtils.subtract(position, MatrixUtils.multiplyVector3(this.modelMatrix, position)));
    }

    overrideRotation(rotation: Vector3, center: Vector3): void {
        if (!center) {
            this.transform.rotation = rotation;
        } else {
            const transforms = this.completeExtraTransforms.filter(x => VectorUtils.equal(x.rotationalCenter, center));
            for (const transform of transforms) {
                for (let i = 0; i < 3; i++){
                    rotation[i] -= transform.rotation[i];
                }
            }
            this.extraTransforms.push({
                position: [0, 0, 0],
                rotation: rotation,
                scale: [1, 1, 1],
                rotationalCenter: center
            });
        }
    }
    
    overrideScale(scale: Vector3): void {
        this.transform.scale = scale;
    }

    private fillCenterInTransform(transform: WorldTransform): CompleteWorldTransform {
        return {
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
            rotationalCenter: this.useOriginAsCenter ? [0, 0, 0] : transform.rotationalCenter || this.center,
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