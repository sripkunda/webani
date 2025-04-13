import { Matrix4 } from "../util/matrices/matrix.type";
import { MatrixUtils } from "../util/matrices/matrix.utils";
import { VectorUtils } from "../util/vectors/vector.utils";
import { Vector3 } from "../util/vectors/vector3.type";

export class LorentzCamera {
    position: Vector3;
    rotation: Vector3; 
    fov: number;
    near: number;
    far: number;

    constructor(position: Vector3 = [0, 0, 10], rotation: Vector3 = [0, 180, 0], fov: number = 60, near: number = 0.1, far: number = 1000) {
        this.position = position;
        this.rotation = rotation;
        this.fov = fov;
        this.near = near; 
        this.far = far;
    }

    rotate(eulerAngles: Vector3) {
        this.rotation = [...eulerAngles];
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
        const [pitch, yaw, roll] = this.rotation;

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
            right[0], right[1], right[2], -VectorUtils.dot(right, this.position),
            up[0],    up[1],    up[2],    -VectorUtils.dot(up, this.position),
            -forward[0], -forward[1], -forward[2], VectorUtils.dot(forward, this.position),
            0, 0, 0, 1
        ]) as Matrix4;        
    }

    get copy() {
        return new LorentzCamera(this.position, this.rotation, this.fov, this.near, this.far);
    }
}