import { WebaniInterpolatedAnimation, WebaniInterpolatedAnimationOptions } from "../animations/webani-interpolated-animation.class";
import { Colors } from "../lighting/colors";
import { WebaniMaterial } from "../lighting/webani-material.class";
import { Matrix4 } from "../types/matrix4.type";
import { MatrixUtils } from "../util/matrix.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { WorldTransform } from "../types/world-transform.type";
import { WebaniTransformable } from "./webani-transformable.class";

export type WebaniPrimitiveObjectOptions = {
    position?: Vector3;
    rotation?: Vector3;
    scale?: Vector3;
    rotationalCenter?: Vector3;
    material?: WebaniMaterial;
    extraTransforms?: WorldTransform[];
};

export abstract class WebaniPrimitiveObject extends WebaniTransformable {

    material: WebaniMaterial;
    protected _triangulation!: Float32Array;
    protected _normals!: Float32Array;
    protected _uvs?: Float32Array;
    localCenter!: Vector3;

    constructor({
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        rotationalCenter,
        material = new WebaniMaterial({ color: Colors.WHITE }),
        extraTransforms = [],
    }: WebaniPrimitiveObjectOptions = {}) {
        super({ position, rotation, scale, rotationalCenter, extraTransforms });
        this.material = material;
    }

    abstract animationClass?: new (options: WebaniInterpolatedAnimationOptions<WebaniPrimitiveObject>) => WebaniInterpolatedAnimation<WebaniPrimitiveObject>;
    abstract get copy(): WebaniPrimitiveObject;
    abstract resolveObjectGeometry(): void;

    get center(): Vector3 {
        return MatrixUtils.multiplyVector3(
            MatrixUtils.fromTRS(this.transform.position, [0, 0, 0], this.transform.scale),
            this.localCenter
        );
    }

    get modelMatrix(): Matrix4 {
        const transform = this.transform;
        let matrix = MatrixUtils.fromTRS(
            transform.position,
            transform.rotation,
            transform.scale,
            transform.rotationalCenter || this.center
        );

        for (let transform of this.extraTransforms) {
            matrix = MatrixUtils.multiply(
                MatrixUtils.fromTRS(
                    transform.position,
                    transform.rotation,
                    transform.scale,
                    transform.rotationalCenter || this.center
                ),
                matrix
            );
        }

        return matrix;
    }

    get triangles(): Float32Array {
        return this._triangulation;
    }

    get normals(): Float32Array {
        return this._normals;
    }

    copyCenteredAt(newCenter: Vector3): WebaniPrimitiveObject {
        newCenter = VectorUtils.convertPointTo3D(newCenter) || newCenter;
        const copy = this.copy;
        const center = this.center;
        copy.transform.position = VectorUtils.add(
            copy.transform.position,
            VectorUtils.subtract(newCenter, center)
        );
        return copy;
    }
}
