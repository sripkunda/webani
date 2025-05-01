import { WorldTransform } from "../types/world-transform.type";
import { Vector3 } from "../types/vector3.type";
import { VectorUtils } from "../util/vector.utils";
import { CompleteWorldTransform } from "../types/complete-world-transform.type";
import { MatrixUtils } from "../util/matrix.utils";
import { Matrix4 } from "../types/matrix4.type";
import { WebaniInterpolatedAnimation, WebaniInterpolatedAnimationOptions } from "../animation/webani-interpolated-animation.class";

/**
 * Options for constructing a `WebaniTransformable`.
 * 
 * @property position - The position of the object in 3D space. Default is `[0, 0, 0]`.
 * @property rotation - The rotation of the object as a vector. Default is `[0, 0, 0]`.
 * @property scale - The scale of the object. Default is `[1, 1, 1]`.
 * @property rotationalCenter - The center of rotation for the object. Default is `undefined`.
 * @property extraTransforms - An array of additional transformations to apply to the object. Default is an empty array.
 * @property useOriginAsCenter - If `true`, the object's center is set to the origin. Default is `false`.
 * @property scaleCompensation - If `true`, the scale of the parent will be compensated for. Default is `false`.
 */
export type WebaniTransformableOptions = {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    rotationalCenter?: Vector3;
    extraTransforms?: WorldTransform[];
    useOriginAsCenter?: boolean;
    scaleCompensation?: boolean;
};

/**
 * The base class for all transformable objects in the Webani framework.
 * This class handles transformations such as translation, rotation, scaling, and parent-child relationships.
 */
export class WebaniTransformable {
    /**
     * The world transform of the object, including position, rotation, and scale.
     */
    transform: WorldTransform = {
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
    };

    /**
     * An array of additional world transforms that modify the object.
     */
    extraTransforms: WorldTransform[] = [];

    /**
     * The parent transformable object, if any.
     */
    parent?: WebaniTransformable;

    /**
     * Flag indicating whether to use the origin as the center of rotation.
     */
    useOriginAsCenter: boolean = false;

    /**
     * Flag indicating whether to apply scale compensation for the parent object.
     */
    scaleCompensation: boolean = false;

    /**
     * Optional animation class used for interpolated animations.
     */
    animationClass?: new (options: WebaniInterpolatedAnimationOptions<WebaniTransformable>) => WebaniInterpolatedAnimation<WebaniTransformable>;

    /**
     * Creates an instance of `WebaniTransformable` with specified options.
     * 
     * @param options - Options to customize the object's position, rotation, scale, and other properties.
     */
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

    /**
     * The local center of the object, which is `[0, 0, 0]` by default.
     * 
     * @returns The local center of the object as a `Vector3` object.
     */
    get localCenter(): Vector3 { 
        return [0, 0, 0];
    }

    /**
     * The complete world transform of the object, including position, rotation, scale, and rotational center.
     * 
     * @returns The complete world transform as a `CompleteWorldTransform` object.
     */
    get completeTransform(): CompleteWorldTransform {
        return this.fillCenterInTransform(this.transform);
    }

    /**
     * The complete world transforms of the object's extra transformations, including position, rotation, scale, and rotational center.
     * 
     * @returns An array of `CompleteWorldTransform` objects for the extra transforms.
     */
    get completeExtraTransforms(): CompleteWorldTransform[] {
        return this.extraTransforms.map(t => this.fillCenterInTransform(t));
    }

    /**
     * A copy of the extra transforms array.
     * 
     * @returns A new array with copies of the extra transforms.
     */
    get extraTransformsCopy(): WorldTransform[] {
        return [...this.extraTransforms.map(x => this.copyTransform(x))];
    }

    /**
     * A copy of the main transform.
     * 
     * @returns A new `WorldTransform` object that is a copy of the main transform.
     */
    get transformCopy(): WorldTransform {
        return this.copyTransform(this.transform);
    }

    /**
     * Creates a shallow copy of the `WebaniTransformable` object.
     * 
     * @returns A new instance of `WebaniTransformable` with the same properties as the current object.
     */
    get shallowCopy() { 
        const clone = Object.create(this.constructor.prototype) as this;
        Object.assign(clone, this); 
        clone.extraTransforms = this.extraTransformsCopy;
        clone.transform = this.transformCopy;
        return clone;
    }

    /**
     * The combined matrix of all extra transforms without scale compensation.
     * 
     * @returns A `Matrix4` object representing the combined matrix of all extra transforms.
     */
    get extraTransformsMatrixWithoutScale(): Matrix4 {
        let matrix = MatrixUtils.identity();
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

    /**
     * The model matrix of the object without scale compensation.
     * 
     * @returns A `Matrix4` object representing the model matrix without scale compensation.
     */
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

    /**
     * The model matrix of the object, including scale compensation if needed.
     * 
     * @returns A `Matrix4` object representing the model matrix with scale compensation.
     */
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

    /**
     * The center of the object, which is the position.
     * 
     * @returns The center of the object as a `Vector3` object.
     */
    get center(): Vector3 { 
        return this.transform.position;
    }

    /**
     * Translates the object by a specified offset.
     * 
     * @param offset - The offset to translate the object by.
     */
    translate(offset: Vector3): void {
        this.transform.position = VectorUtils.add(this.transform.position, offset);
    }

    /**
     * Rotates the object by a specified offset around an optional center.
     * 
     * @param offset - The rotation offset as a `Vector3` object.
     * @param center - The center of rotation. If not provided, the rotation is applied globally.
     */
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

    /**
     * Scales the object by a specified factor.
     * 
     * @param factor - The scaling factor as a `Vector3` object.
     */
    scaleBy(factor: Vector3): void {
        this.transform.scale = [
            this.transform.scale[0] * factor[0],
            this.transform.scale[1] * factor[1],
            this.transform.scale[2] * factor[2]
        ];
    }

    /**
     * Sets the position of the object.
     * 
     * @param position - The new position as a `Vector3` object.
     */
    setPosition(position: Vector3): void {
        this.transform.position = position;
    }

    /**
     * Sets the rotation of the object around a specified center.
     * 
     * @param rotation - The new rotation as a `Vector3` object.
     * @param center - The center of rotation.
     */
    setRotation(rotation: Vector3, center: Vector3): void {
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

    /**
     * Sets the scale of the object.
     * 
     * @param scale - The new scale as a `Vector3` object.
     */
    setScale(scale: Vector3): void {
        this.transform.scale = scale;
    }

    /**
     * Fills the center in the transform, either using the provided rotational center or defaulting to the origin.
     * 
     * @param transform - The world transform to modify.
     * @returns The updated world transform with a filled rotational center.
     */
    private fillCenterInTransform(transform: WorldTransform): CompleteWorldTransform {
        return {
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
            rotationalCenter: this.useOriginAsCenter ? [0, 0, 0] : transform.rotationalCenter || this.center,
        };
    }

    /**
     * Creates a copy of a given transform.
     * 
     * @param transform - The world transform to copy.
     * @returns A new copy of the world transform.
     */
    private copyTransform(transform: WorldTransform) { 
        return {
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
            rotationalCenter: transform.rotationalCenter,
        }
    }
}