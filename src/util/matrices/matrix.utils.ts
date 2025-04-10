import { Vector4 } from "../vectors/vector4.type";
import { Matrix4 } from "./matrix.type";

export const MatrixUtils = {
    multiply(a: Matrix4, b: Matrix4): Matrix4 {
        const result = new Float32Array([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]) as Matrix4;

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                result[row * 4 + col] = 
                    a[row * 4 + 0] * b[0 * 4 + col] +
                    a[row * 4 + 1] * b[1 * 4 + col] +
                    a[row * 4 + 2] * b[2 * 4 + col] +
                    a[row * 4 + 3] * b[3 * 4 + col];
            }
        }

        return result;
    },
    multiplyVector(a: Matrix4, b: Vector4): Vector4 { 
        const result: Vector4 = [
            a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3],
            a[4] * b[0] + a[5] * b[1] + a[6] * b[2] + a[7] * b[3],
            a[8] * b[0] + a[9] * b[1] + a[10] * b[2] + a[11] * b[3],
            a[12] * b[0] + a[13] * b[1] + a[14] * b[2] + a[15] * b[3]
        ];
        return result;
    }
};