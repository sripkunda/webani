import { Matrix4 } from "../util/matrices/matrix.type";
import { MatrixUtils } from "../util/matrices/matrix.utils";
import { VectorUtils } from "../util/vectors/vector.utils";
import { Vector3 } from "../util/vectors/vector3.type";
import { WanimCameraCache } from "./wanim-camera-cache.type";

export class WanimCamera {
    position: Vector3;
    rotation: Vector3; 
    fov: number;
    near: number;
    far: number;
    
    private _cache: WanimCameraCache;

    constructor(position: Vector3 = [0, 0, -100], rotation: Vector3 = [0, 0, 0], fov: number = 90, near: number = 0.1, far: number = 1000) {
        this.position = position;
        this.rotation = rotation;
        this.fov = fov;
        this.near = near; 
        this.far = far;
        this._cache = {
            viewMatrix: null,
            projectionMatrix: null,
            screenHeight: 0,
            screenWidth: 0,
            position: [...this.position],
            rotation: [...this.rotation],
            fov: this.fov,
            near: this.near,
            far: this.far
        }
    }

    rotate(eulerAngles: Vector3) {
        this.rotation = [...eulerAngles];
    }
r
    transformPointArray(points: Vector3[], screenWidth: number, screenHeight: number): Vector3[] { 
        console.log(points);
        const homogenousPoints = VectorUtils.convertPointsTo4D(points);
        let transformedPoints: Vector3[] = [];
        console.log(homogenousPoints);
        let vpMatrix = this.getVPMatrix(screenWidth, screenHeight);
        for (let point of homogenousPoints) { 
            const transformedPoint = MatrixUtils.multiplyVector(vpMatrix, point);
            transformedPoints.push(VectorUtils.convertPointTo3D(transformedPoint));
        }
        return transformedPoints;
    }

    getVPMatrix(screenWidth: number, screenHeight: number): Matrix4 {
        return MatrixUtils.multiply(this.getProjectionMatrix(screenWidth, screenHeight), this.getViewMatrix());
    }

    private isCachedProjectionMatrixValid(screenWidth: number, screenHeight: number): boolean { 
        return this._cache.projectionMatrix !== null &&
            this._cache.fov === this.fov &&
            this._cache.near === this.near &&
            this._cache.far === this.far &&
            (this._cache.screenWidth / this._cache.screenHeight) === (screenWidth / screenHeight);
    }

    private isCachedViewMatrixValid(): boolean { 
        return this._cache.viewMatrix !== null && this.position.every((x, i) => x == this._cache.position[i]) && this.rotation.every((x, i) => x == this._cache.rotation[i]);
    }

    getProjectionMatrix(screenWidth: number, screenHeight: number) { 
        if (!this.isCachedProjectionMatrixValid(screenWidth, screenHeight)) { 
            this.cacheProjectionMatrix(screenWidth, screenHeight);
        } 
        return this._cache.projectionMatrix;
    }

    getViewMatrix() { 
        if (!this.isCachedViewMatrixValid()) { 
            this.cacheViewMatrix();
        } 
        return this._cache.viewMatrix;
    }

    cacheProjectionMatrix(screenWidth: number, screenHeight: number) {
        const aspectRatio = screenWidth / screenHeight;
        const f = 1.0 / Math.tan((this.fov * Math.PI) / 360);

        this._cache.projectionMatrix = new Float32Array([
            f / aspectRatio, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.far + this.near) / (this.near - this.far), -1,
            0, 0, (2 * this.far * this.near) / (this.near - this.far), 0]) as Matrix4;
    }

    cacheViewMatrix() { 
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

        this._cache.viewMatrix = new Float32Array([
            right[0], up[0], -forward[0], 0,
            right[1], up[1], -forward[1], 0,
            right[2], up[2], -forward[2], 0,
            -VectorUtils.dot(right, this.position), -VectorUtils.dot(up, this.position), VectorUtils.dot(forward, this.position), 1
        ]) as Matrix4;
    }

    get copy() {
        return new WanimCamera(this.position, this.rotation, this.fov, this.near, this.far);
    }
}