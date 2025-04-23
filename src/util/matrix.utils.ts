import { VectorUtils } from "./vector.utils";
import { Vector3 } from "../types/vector3.type";
import { Matrix4 } from "../types/matrix4.type";
import { Vector4 } from "../types/vector4.type";

export const MatrixUtils = {
    multiply(a: Matrix4, b: Matrix4): Matrix4 {
        const result = new Float32Array(16) as Matrix4;
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

    identity(): Matrix4 { 
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]) as Matrix4;
    },

    multiplyVector3(matrix: Matrix4, point: Vector3): Vector3 {
        const [x, y, z] = point;
        const resultX =
            matrix[0] * x + matrix[1] * y + matrix[2] * z + matrix[3];
        const resultY =
            matrix[4] * x + matrix[5] * y + matrix[6] * z + matrix[7];
        const resultZ =
            matrix[8] * x + matrix[9] * y + matrix[10] * z + matrix[11];
        const w =
            matrix[12] * x + matrix[13] * y + matrix[14] * z + matrix[15];

        if (w !== 0 && w !== 1) {
            return [resultX / w, resultY / w, resultZ / w];
        }
    
        return [resultX, resultY, resultZ];
    },

    translationMatrix(t: Vector3): Matrix4 {
        return new Float32Array([
            1, 0, 0, t[0],
            0, 1, 0, t[1],
            0, 0, 1, t[2],
            0, 0, 0, 1
        ]) as Matrix4;
    },

    scaleMatrix(s: Vector3): Matrix4 {
        return new Float32Array([
            s[0], 0, 0, 0,
            0, s[1], 0, 0,
            0, 0, s[2], 0,
            0, 0, 0, 1
        ]) as Matrix4;
    },

    rotationMatrix(r: Vector3): Matrix4 {
        const [x, y, z] = VectorUtils.multiply(r, Math.PI / 180);
        const cx = Math.cos(x), sx = Math.sin(x);
        const cy = Math.cos(y), sy = Math.sin(y);
        const cz = Math.cos(z), sz = Math.sin(z);

        const rx = new Float32Array([
            1, 0, 0, 0,
            0, cx, -sx, 0,
            0, sx, cx, 0,
            0, 0, 0, 1
        ]) as Matrix4;

        const ry = new Float32Array([
            cy, 0, sy, 0,
            0, 1, 0, 0,
            -sy, 0, cy, 0,
            0, 0, 0, 1
        ]) as Matrix4;

        const rz = new Float32Array([
            cz, -sz, 0, 0,
            sz, cz, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]) as Matrix4;

        return MatrixUtils.multiply(
            MatrixUtils.multiply(rz, ry),
            rx
        );
    },

    rotationMatrixAboutPoint(rotation: Vector3, point: Vector3): Matrix4 {
        const translateToOrigin = MatrixUtils.translationMatrix(VectorUtils.multiply(point, -1));
        const rotate = MatrixUtils.rotationMatrix(rotation);
        const translateBack = MatrixUtils.translationMatrix(point);
    
        return MatrixUtils.multiply(
            MatrixUtils.multiply(translateBack, rotate),
            translateToOrigin
        );
    },

    rotationMatrixAboutPointQuaternion(rotation: Vector4, point: Vector3): Matrix4 {
        const translateToOrigin = MatrixUtils.translationMatrix(VectorUtils.multiply(point, -1));
        const rotate = MatrixUtils.rotationMatrixQuaternion(rotation);
        const translateBack = MatrixUtils.translationMatrix(point);
    
        return MatrixUtils.multiply(
            MatrixUtils.multiply(translateBack, rotate),
            translateToOrigin
        );
    },

    rotationMatrixQuaternion([x, y, z, w]: Vector4): Matrix4 { 
        const xx = x * x, yy = y * y, zz = z * z;
        const xy = x * y, xz = x * z, yz = y * z;
        const wx = w * x, wy = w * y, wz = w * z;

        const m = new Float32Array(16);
        m[0] = 1 - 2 * (yy + zz);
        m[1] = 2 * (xy + wz);
        m[2] = 2 * (xz - wy);
        m[3] = 0;

        m[4] = 2 * (xy - wz);
        m[5] = 1 - 2 * (xx + zz);
        m[6] = 2 * (yz + wx);
        m[7] = 0;

        m[8] = 2 * (xz + wy);
        m[9] = 2 * (yz - wx);
        m[10] = 1 - 2 * (xx + yy);
        m[11] = 0;

        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;

        return m as Matrix4;
    },

    fromTRSQuaternion(translation: Vector3, rotation: Vector4, scale: Vector3, rotationalCenter?: Vector3): Matrix4 { 
        const T = MatrixUtils.translationMatrix(translation);
        const R = rotationalCenter ? MatrixUtils.rotationMatrixAboutPointQuaternion(rotation, rotationalCenter) : MatrixUtils.rotationMatrixQuaternion(rotation);
        const S = MatrixUtils.scaleMatrix(scale);

        return MatrixUtils.multiply(
            MatrixUtils.multiply(T, R),
            S
        );
    },

    fromTRS(translation: Vector3, rotation: Vector3, scale: Vector3, rotationalCenter?: Vector3): Matrix4 {
        const T = MatrixUtils.translationMatrix(translation);
        const R = rotationalCenter ? MatrixUtils.rotationMatrixAboutPoint(rotation, rotationalCenter) : MatrixUtils.rotationMatrix(rotation);
        const S = MatrixUtils.scaleMatrix(scale);

        return MatrixUtils.multiply(
            MatrixUtils.multiply(T, R),
            S
        );
    },

    transpose(matrix: Matrix4): Matrix4 {
        const result = new Float32Array(16) as Matrix4;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                result[row * 4 + col] = matrix[col * 4 + row];
            }
        }
        return result;
    }
    
};