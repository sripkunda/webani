import earcut from "earcut";
import { Vector3 } from "../types/vector3.type";
import 'mathjax/es5/tex-svg';
import { Vector2 } from "../types/vector2.type";

export const triangulate = (points: number[], holes: number[]) => {
    return earcut(points, holes);
};

export const windingOrderClockwise = (points: Vector2[]) => {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        sum += (points[j][0] - points[i][0]) * (points[j][1] + points[i][1]);
    }
    return sum < 0 ? true : false;
};

export async function executeInParallel(funct: (...args: unknown[]) => unknown, args: unknown[], threadCount = Math.min(navigator.hardwareConcurrency, 2)) {
    const result: unknown[] = [];
    while (args.length) {
      const res = await Promise.all(args.splice(0, threadCount).map(x => funct(x)));
      result.push(res);
    }
    return result.flat();
}

export function isLeft(p1: Vector2, p2: Vector2, p3: Vector2) {
    // Cross product to determine if p3 is left of the directed line (p1 -> p2)
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p3[0] - p1[0]) * (p2[1] - p1[1]);
}

export function pointInPolygon(polygonPoints: Vector2[], point: Vector3) {
    const [px, py] = point;
    let windingNumber = 0;
    const n = polygonPoints.length;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = polygonPoints[i];
        const [x2, y2] = polygonPoints[(i + 1) % n]; // Wrap around to the first point

        if (y1 <= py) {
            if (y2 > py && isLeft([x1, y1], [x2, y2], [px, py]) > 0) {
                windingNumber++;
            }
        } else {
            if (y2 <= py && isLeft([x1, y1], [x2, y2], [px, py]) < 0) {
                windingNumber--;
            }
        }
    }
    return windingNumber !== 0; // Nonzero means inside
}

export function pointsInPolygon(polygonPoints: Vector2[], points: Vector3[]) {
    for (const point of points) { 
        if (!pointInPolygon(polygonPoints, point))
            return;
    }
    return true;
}