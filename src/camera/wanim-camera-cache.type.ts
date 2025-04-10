import { Matrix4 } from "../util/matrices/matrix.type"
import { Vector3 } from "../util/vectors/vector3.type"

export type WanimCameraCache = {
    viewMatrix: Matrix4,
    projectionMatrix: Matrix4,
    screenHeight: number,
    screenWidth: number,
    position: Vector3, 
    rotation: Vector3,
    fov: number,
    near: number,
    far: number
}