import { Vector2 } from "../types/vector2.type";
import { Vector3 } from "../types/vector3.type";
import { Vector4 } from "../types/vector4.type";

export const VectorUtils = {
    center: (points: Vector3[]): Vector3 => {
        const denominator = 1 / points.length;
        return points.reduce(
            (accumulator, currentValue) => [
                accumulator[0] + denominator * currentValue[0],
                accumulator[1] + denominator * currentValue[1],
                accumulator[2] + denominator * currentValue[2],
            ],
            [0, 0, 0]
        );
    },

    multiply: (point: Vector3, scalar: number): Vector3 => {
        return point.map(x => x * scalar) as Vector3;
    },

    add: (a: Vector3, b: Vector3): Vector3 => {
        return a.map((x, i) => x + b[i]) as Vector3;
    },

    norm: (a: Vector3): number => {
        return VectorUtils.distance(a, [0, 0, 0]);
    },

    subtract: (a: Vector3, b: Vector3): Vector3 => {
        return VectorUtils.add(a, VectorUtils.multiply(b, -1));
    },

    distance: (a: Vector3, b: Vector3): number => {
        return Math.sqrt(
            Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)
        );
    },

    convertPointsToDimension(points: number[][], dimension: number, fillValue: number = 0): number[][] {
        return points.map(point => {
            if (point.length < dimension) {
                return [...point, ...new Array(dimension - point.length).fill(fillValue)];
            } else {
                return point.slice(0, dimension);
            }
        });
    },

    convertPointsTo2D(points: number[][]): Vector2[] {
        return VectorUtils.convertPointsToDimension(points, 2) as Vector2[];
    },

    convertPointsTo3D(points: number[][]): Vector3[] {
        return VectorUtils.convertPointsToDimension(points, 3) as Vector3[];
    },

    convertPointsToHomogenous(points: number[][]): Vector4[] {
        return VectorUtils.convertPointsToDimension(points, 4, 1) as Vector4[];
    },

    convertPointTo3D: (point: number[]): Vector3 => {
        const converted = VectorUtils.convertPointsTo3D([point]);
        return converted[0];
    },

    dot: (a: number[], b: number[]): number => {
        return a.reduce((acc, curr, i) => acc + (curr * b[i]), 0);
    },

    cross: (a: Vector3, b: Vector3): Vector3 => {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    },

    normalize: (a: Vector3): Vector3 => {
        const mag = VectorUtils.norm(a);
        return mag !== 0 ? VectorUtils.multiply(a, 1 / mag) : a;
    },

    angleBetween: (a: Vector3, b: Vector3): number => {
        const dot = VectorUtils.dot(a, b);
        const normA = VectorUtils.norm(a);
        const normB = VectorUtils.norm(b);
        return Math.acos(dot / (normA * normB));
    },

    isZero: (a: Vector3): boolean => {
        return a[0] === 0 && a[1] === 0 && a[2] === 0;
    },

    equal(a: number[], b: number[]) { 
        if (a.length != b.length) return false;
        return a.every((x, i) => x == b[i]);
    },

    arraysEqual(a: number[][], b: number[][]) { 
        if (a.length != b.length) return false;
        a.every((x, i) => VectorUtils.equal(x, b[i]));
    },
    
    quaternionToEulerAngles(q: Vector4): Vector3 {
        const [x, y, z, w] = q;
    
        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);
    
        const sinp = 2 * (w * y - z * x);
        let pitch: number;
        if (Math.abs(sinp) >= 1) {
            pitch = Math.sign(sinp) * Math.PI / 2;
        } else {
            pitch = Math.asin(sinp);
        }
    
        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);
    
        return [roll * 180 / Math.PI, pitch * 180 / Math.PI, yaw * 180 / Math.PI];
    },

    addFlat<T, U>(array: T, dim: number, vectorIndex: number, b: U, factor = 1): T {
        for (let i = 0; i < dim; i++) {
            array[dim * vectorIndex + i] += factor * b[i];
        }
        return array;
    },

    setFlat<T, U>(array: T, dim: number, vectorIndex: number, b: U, factor = 1): T {
        for (let i = 0; i < dim; i++) {
            array[dim * vectorIndex + i] = factor * b[i];
        }
        return array;
    }
};