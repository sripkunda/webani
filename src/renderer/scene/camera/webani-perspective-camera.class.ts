import { Matrix4 } from "../../types/matrix4.type";
import { MatrixUtils } from "../../util/matrix.utils";
import { VectorUtils } from "../../util/vector.utils";
import { Vector3 } from "../../types/vector3.type";
import { WebaniTransformable } from "../webani-transformable.class";

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
        rotation = [0, 0, 0],
        fov = 60,
        near = 0.1,
        far = 2e+10
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
        const position = this.position;
        const cosPitch = Math.cos(pitch * Math.PI / 180);
        const sinPitch = Math.sin(pitch * Math.PI / 180);
        const cosYaw = Math.cos((yaw + 180) * Math.PI / 180);
        const sinYaw = Math.sin((yaw + 180) * Math.PI / 180);

        const forward = VectorUtils.normalize([
            cosPitch * sinYaw, 
            sinPitch, 
            cosPitch * cosYaw
        ]);
        const right = VectorUtils.normalize(VectorUtils.cross(forward, [0, 1, 0])); 
        const up = VectorUtils.cross(right, forward);

        return new Float32Array([
            right[0], right[1], right[2], -VectorUtils.dot(right, position),
            up[0],    up[1],    up[2],    -VectorUtils.dot(up, position),
            -forward[0], -forward[1], -forward[2], VectorUtils.dot(forward, position),
            0, 0, 0, 1
        ]) as Matrix4;        
    }

    get position() { 
        return MatrixUtils.multiplyVector3(this.extraTransformsMatrixWithoutScale, this.transform.position);
    }

    get rotation(): Vector3 { 
        let rotation = [...this.transform.rotation] as Vector3;
        for (const transform of this.extraTransforms) { 
            for (let i = 0; i < 3; i++) { 
                rotation[i] += transform.rotation[i];
            }
        }
        rotation[0] = Math.max(-90, Math.min(rotation[0] % 360, 90));
        return rotation;
    }
}
