import { Matrix4 } from "../../types/matrix4.type";
import { MatrixUtils } from "../../util/matrix.utils";
import { VectorUtils } from "../../util/vector.utils";
import { Vector3 } from "../../types/vector3.type";
import { WebaniTransformable } from "../webani-transformable.class";

/**
 * Options for initializing a WebaniPerspectiveCamera.
 */
export type WebaniPerspectiveCameraOptions = {
    /**
     * The position of the camera in 3D space (default is [0, 0, 0]).
     */
    position?: Vector3;
    
    /**
     * The rotation of the camera in degrees around each axis (default is [0, 0, 0]).
     */
    rotation?: Vector3;
    
    /**
     * The field of view (FOV) of the camera in degrees (default is 60).
     */
    fov?: number;
    
    /**
     * The near plane distance for the camera (default is 0.1).
     */
    near?: number;
    
    /**
     * The far plane distance for the camera (default is 2e+10).
     */
    far?: number;
};

/**
 * A class representing a perspective camera in a 3D environment.
 * It extends from WebaniTransformable to support position, rotation, and other transformations.
 */
export class WebaniPerspectiveCamera extends WebaniTransformable {

    /**
     * The field of view of the camera.
     */
    fov: number;

    /**
     * The near plane distance for the camera.
     */
    near: number;

    /**
     * The far plane distance for the camera.
     */
    far: number;

    /**
     * Creates a new WebaniPerspectiveCamera instance.
     * @param options The configuration options for the camera.
     */
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

    /**
     * Returns the local center of the camera, always [0, 0, 0].
     */
    get localCenter(): Vector3 {
        return [0, 0, 0] as Vector3;
    }

    /**
     * Returns the world position of the camera, based on its transform.
     */
    get center(): Vector3 {
        return this.transform.position;
    }

    /**
     * Computes the projection matrix for the camera, given the screen dimensions.
     * @param screenWidth The width of the screen.
     * @param screenHeight The height of the screen.
     * @returns A Matrix4 representing the projection matrix.
     */
    projectionMatrix(screenWidth: number, screenHeight: number): Matrix4 { 
        const aspectRatio = screenWidth / screenHeight;
        const f = 1.0 / Math.tan((this.fov * Math.PI) / 360);

        return new Float32Array([
            f / aspectRatio, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.far + this.near) / (this.near - this.far), (2 * this.far * this.near) / (this.near - this.far),
            0, 0, -1, 0
        ]) as Matrix4;
    }

    /**
     * Computes the view matrix of the camera based on its position and rotation.
     * @returns A Matrix4 representing the view matrix.
     */
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

    /**
     * Returns the position of the camera, transformed by any extra transforms applied.
     */
    get position(): Vector3 { 
        return MatrixUtils.multiplyVector3(this.extraTransformsMatrixWithoutScale, this.transform.position);
    }

    /**
     * Computes the camera's rotation, accounting for any extra transforms.
     * @returns The camera's rotation as a Vector3.
     */
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
