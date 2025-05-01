import { Colors } from "../renderer/scene/lighting/colors";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { Component } from "../renderer/scene/component.class";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";

/**
 * Options for creating a rectangle component.
 */
type RectangleComponentOptions = {
    /** The position of the rectangle in 3D space. */
    position: Vector3;

    /** The length of the rectangle along the X-axis. */
    length_x: number;

    /** The length of the rectangle along the Y-axis. */
    length_y: number;

    /** Optional material to style the rectangle. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that creates a 3D rectangle polygon based on the provided position, lengths, and material.
 * 
 * The rectangle is centered at the given position with sides aligned along the X and Y axes.
 */
export class RectangleComponent extends Component {
    /**
     * Constructs a `WebaniPolygon` representing a rectangle.
     * 
     * The rectangle is defined by the `length_x` and `length_y` dimensions, and it is centered at the
     * given `position`. The material can be customized, or a default white material is applied.
     * 
     * @param options - Configuration object containing the position, length_x, length_y, and optional material.
     * @returns A `WebaniPolygon` instance representing the rectangle.
     */
    objectConstructor({ 
        position,
        length_x,
        length_y,
        material = { color: Colors.WHITE, opacity: 1 }
    }: RectangleComponentOptions) {
        return new WebaniPolygon({
            position: position,
            filledPoints: [
                [-length_x / 2, -length_y / 2, 0],
                [ length_x / 2, -length_y / 2, 0],
                [ length_x / 2,  length_y / 2, 0],
                [-length_x / 2,  length_y / 2, 0]  
            ],
            material: new WebaniMaterial(material)
        });
    }
}

/**
 * A reusable generator instance for creating rectangle components.
 */
export const Rectangle = RectangleComponent.GetGenerator();
