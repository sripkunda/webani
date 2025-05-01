import { WebaniPolygonAnimation } from "./webani-polygon-animation.class";
import { WebaniPrimitiveObject } from "../webani-primitive-object.class";
import { triangulate } from "../../util/polygon.utils";
import { VectorUtils } from "../../util/vector.utils";
import { Vector3 } from "../../types/vector3.type";
import { WorldTransform } from "../../types/world-transform.type";
import { WebaniMaterial } from "../lighting/webani-material.class";

/**
 * Options for initializing a `WebaniPolygon` object.
 */
export type WebaniPolygonOptions = {
    /**
     * The position of the polygon's center in 3D space, represented as an array of numbers `[x, y, z]`.
     */
    position: number[]; 

    /**
     * The scale of the polygon in 3D space, represented as a `Vector3`. 
     * Optional property, default is [1, 1, 1].
     */
    scale?: Vector3;

    /**
     * The rotation of the polygon, represented as a `Vector3`. 
     * Optional property, default is [0, 0, 0].
     */
    rotation?: Vector3;

    /**
     * An array of filled points that define the polygon's outer shape.
     */
    filledPoints: number[][];

    /**
     * An array of holes in the polygon, each hole defined by an array of points.
     * Optional property.
     */
    holes?: number[][][];

    /**
     * The rotational center for the polygon. 
     * Optional property.
     */
    rotationalCenter?: Vector3;

    /**
     * The material for the polygon, which defines its appearance.
     * Optional property.
     */
    material?: WebaniMaterial;

    /**
     * Additional transforms applied to the polygon.
     * Optional property.
     */
    extraTransforms?: WorldTransform[];
};

/**
 * Represents a polygon in 3D space. This class extends `WebaniPrimitiveObject` and supports 
 * complex polygon shapes with holes, triangulation, and animation.
 */
export class WebaniPolygon extends WebaniPrimitiveObject {

    /**
     * The filled points defining the outer shape of the polygon.
     */
    _filledPoints!: Vector3[];

    /**
     * The holes within the polygon, each hole defined by a set of points.
     */
    _holes!: Vector3[][];

    /**
     * The class used for animating the polygon.
     */
    animationClass = WebaniPolygonAnimation;

    /**
     * Creates a new `WebaniPolygon` instance with the provided options.
     * @param options The configuration options for the polygon.
     */
    constructor({
        position, 
        filledPoints,
        holes = [],
        rotation = [0, 0, 0], 
        scale = [1, 1, 1],
        rotationalCenter,
        material,
        extraTransforms = []
    }: WebaniPolygonOptions) {
        super({
            position: VectorUtils.convertPointTo3D(position), 
            rotation, 
            scale, 
            rotationalCenter, 
            material, 
            extraTransforms
        });
        this._filledPoints = VectorUtils.convertPointsTo3D(filledPoints);
        this._holes = holes.map(holePoints => VectorUtils.convertPointsTo3D(holePoints));
        this.resolveObjectGeometry();
    }

    /**
     * Returns an array of indices that represent where the holes in the polygon start in the point array.
     * @returns An array of hole indices.
     */
    get holeIndices() {
        let sum = this._filledPoints.length;
        const indices: number[] = [];
        for (const hole of this._holes) {
            indices.push(sum);
            sum += hole.length;
        }
        return indices;
    }

    /**
     * Returns a shallow copy of the polygon object.
     * @returns A new `WebaniPolygon` instance with the same properties.
     */
    get shallowCopy() {
        const clone = super.shallowCopy;
        clone._filledPoints = [...this._filledPoints];
        clone._holes = [...this._holes];
        return clone;
    }

    /**
     * Returns the array of all points (including both the filled points and the holes).
     * @returns A flat array of points.
     */
    get pointArray() { 
        const p = [...this._filledPoints];
        for (const holePoints of this._holes) {
            p.push(...holePoints);
        }
        return p;   
    }

    /**
     * Resolves the geometry of the polygon, including triangulation, normals, and local center.
     */
    resolveObjectGeometry() { 
        this._triangulation = this.computeTrianguation();
        this._normals = this.computeNormals();
        this._localCenter = VectorUtils.center(this._filledPoints);
        this.fillArrays(this._triangulation.length / 3, 0);
    }

    /**
     * Computes the normals for the polygon. For simplicity, it assigns `1` to every third element of the normal array.
     * @returns An array of normals.
     */
    computeNormals() {
        const n = this._triangulation.length;
        const arr = new Float32Array(n);
        for (let i = 2; i < n; i += 3) {
            arr[i] = 1;
        }
        return arr;     
    }

    /**
     * Computes the triangulation for the polygon using the filled points and holes.
     * This method uses the `triangulate` utility function.
     * @returns A `Float32Array` representing the triangulated points of the polygon.
     */
    computeTrianguation(): Float32Array {
        let triangulation: Float32Array;
        const holeIndices = this.holeIndices;
        const points = this._holes.length > 0 ? this.pointArray : this._filledPoints;
        if (points.length > 3) {
            const triangulated = triangulate(VectorUtils.convertPointsTo2D(points).flat(), holeIndices);
            const triangulatedPoints: Float32Array = new Float32Array(triangulated.length * 3);
            for (let i = 0; i < triangulated.length; i++) {
                let point = points[triangulated[i]];
                triangulatedPoints[3 * i] = point[0];
                triangulatedPoints[3 * i + 1] = point[1];
                triangulatedPoints[3 * i + 2] = point[2];
            }
            triangulation = triangulatedPoints;
        } else {
            triangulation = new Float32Array(points.flat());
        }
        return triangulation;
    }
}
