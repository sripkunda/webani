import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { Vector2 } from "../renderer/types/vector2.type";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Colors } from "../renderer/scene/lighting/colors";

/**
 * Options for creating a circle component.
 */
export type CircleComponentOptions = {
    /** The center of the circle in 2D space. */
    center: Vector2;

    /** The radius of the circle. */
    radius: number;

    /** Optional material properties to style the circle. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that generates a circular polygon in the scene.
 * 
 * Extends the base `Component` class and creates a `WebaniPolygon`
 * that approximates a circle using 1000 points.
 */
export class CircleComponent extends Component {
    /**
     * Constructs a circular `WebaniPolygon` from the provided options.
     *
     * @param options - Configuration for center, radius, and optional material.
     * @returns A `WebaniPolygon` representing the circle.
     */
    objectConstructor({
        center,
        radius,
        material = { color: Colors.WHITE, opacity: 1 }
    }: CircleComponentOptions): WebaniPolygon {
        const points: Vector3[] = [];
        const circle = (theta: number): Vector3 => [
            radius * Math.cos(theta),
            radius * Math.sin(theta),
            0
        ];
        
        let angle = 0;
        const stepSize = (2 * Math.PI) / 1000;
        while (angle < 2 * Math.PI) {
            angle += stepSize;
            points.push(circle(angle));
        }

        return new WebaniPolygon({
            position: center,
            filledPoints: points,
            material: new WebaniMaterial(material)
        });
    }
}

/**
 * A reusable generator instance for creating circle components.
 */
export const Circle = CircleComponent.GetGenerator();
