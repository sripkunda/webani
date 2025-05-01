import { Colors } from "../renderer/scene/lighting/colors";
import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";

/**
 * Options for creating a polygon component.
 */
export type PolygonComponentOptions = {
    /** The array of points defining the polygon's vertices. */
    points: Vector3[];

    /** Optional material to style the polygon. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that creates a polygon based on the provided set of vertices.
 * 
 * This component uses `WebaniPolygon` to create a polygon object with the specified points 
 * and material options. The polygon is positioned at the origin ([0, 0, 0]) by default.
 */
export class PolygonComponent extends Component {
    /**
     * Constructs a `WebaniPolygon` based on the provided points and material options.
     * 
     * @param options - Configuration object with points and optional material.
     * @returns A `WebaniPolygon` instance representing the polygon.
     */
    objectConstructor({ 
        points, 
        material = { color: Colors.WHITE, opacity: 1 } 
    }: PolygonComponentOptions): WebaniPolygon {
        return new WebaniPolygon({
            position: [0, 0, 0], 
            filledPoints: points,
            material: new WebaniMaterial(material)
        });
    }
}

/**
 * A reusable generator instance for creating polygon components.
 */
export const Polygon = PolygonComponent.GetGenerator();