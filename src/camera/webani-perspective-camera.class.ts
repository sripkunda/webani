import { Matrix4 } from "../types/matrix4.type";
import { MatrixUtils } from "../util/matrix.utils";
import { VectorUtils } from "../util/vector.utils";
import { Vector3 } from "../types/vector3.type";
import { WebaniTransformable } from "../objects/webani-transformable.class";

export type WebaniPerspectiveCameraOptions = {
    position?: Vector3;
    rotation?: Vector3;
    fov?: number;
    near?: number;
    far?: number;
};

export class WebaniPerspectiveCamera extends WebaniTransformable {

    fov: number;
    near: number;
    far: number;

    constructor({
        position = [0, 0, 0],
        rotation = [0, 180, 0],
        fov = 60,
        near = 0.1,
        far = 1000
    }: WebaniPerspectiveCameraOptions = {}) {
        super({
            position,
            rotation
        });
        this.fov = fov;
        this.near = near; 
        this.far = far;
    }

    get localCenter() {
        return [0, 0, 0] as Vector3;
    }

    get center() {
        return this.transform.position;
    }

    vpMatrix(screenWidth: number, screenHeight: number): Matrix4 {
        return MatrixUtils.multiply(this.projectionMatrix(screenWidth, screenHeight), this.viewMatrix);
    }

    projectionMatrix(screenWidth: number, screenHeight: number): Matrix4 { 
        const aspectRatio = screenWidth / screenHeight;
        const f = 1.0 / Math.tan((this.fov * Math.PI) / 360);

        return new Float32Array([
            f / aspectRatio, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.far + this.near) / (this.near - this.far), (2 * this.far * this.near) / (this.near - this.far),
            0, 0, -1, 0]) as Matrix4;
    }

    get viewMatrix(): Matrix4 { 
        const [pitch, yaw, roll] = this.transform.rotation;

        const cosPitch = Math.cos(pitch * Math.PI / 180);
        const sinPitch = Math.sin(pitch * Math.PI / 180);
        const cosYaw = Math.cos(yaw * Math.PI / 180);
        const sinYaw = Math.sin(yaw * Math.PI / 180);

        const forward = VectorUtils.normalize([
            cosPitch * sinYaw, 
            sinPitch, 
            cosPitch * cosYaw
        ]);
        const right = VectorUtils.normalize(VectorUtils.cross(forward, [0, 1, 0])); 
        const up = VectorUtils.cross(right, forward);

        return new Float32Array([
            right[0], right[1], right[2], -VectorUtils.dot(right, this.transform.position),
            up[0],    up[1],    up[2],    -VectorUtils.dot(up, this.transform.position),
            -forward[0], -forward[1], -forward[2], VectorUtils.dot(forward, this.transform.position),
            0, 0, 0, 1
        ]) as Matrix4;        
    }

    get copy() {
        return new WebaniPerspectiveCamera({
            position: this.transform.position, 
            rotation: this.transform.rotation, 
            fov: this.fov, 
            near: this.near, 
            far: this.far
        });
    }
}
