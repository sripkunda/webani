import { Colors } from "../renderer/scene/lighting/colors";
import { RenderableObject } from "../renderer/types/renderable-object.type";
import { Component } from "../renderer/scene/component.class";
import { Rectangle } from "./rectangle.component";
import { WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";

/**
 * Options for creating a line component.
 */
export type LineComponentOptions = {
    /** The position of the line in 3D space. */
    position: Vector3;

    /** The length of the line. */
    length: number;

    /** The rotation angle of the line in degrees. Default is `0`. */
    angle?: number;

    /** The thickness of the line. Default is `2`. */
    thickness?: number;

    /** Optional material to style the line. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that generates a 3D line by creating a rectangle with adjustable rotation.
 *
 * This extends the `Component` class and uses the `Rectangle` component to represent the line.
 * The rectangle is rotated and scaled to form a line.
 */
export class LineComponent extends Component {
    /**
     * Constructs a `Rectangle` object representing a line.
     * 
     * @param options - Configuration object with position, length, angle, thickness, and optional material.
     * @returns A `RenderableObject` representing the line.
     */
    objectConstructor({ 
        position, 
        length, 
        angle = 0, 
        thickness = 2, 
        material = { color: Colors.WHITE, opacity: 1 }
    }: LineComponentOptions): RenderableObject {
        return Rectangle({
            position,
            length_x: length,
            length_y: Math.max(2, thickness),
            material: material
        }).OverrideRotation([0, 0, angle], [position[0], position[1], 0]);
    }
}

/**
 * A reusable generator instance for creating line components.
 */
export const Line = LineComponent.GetGenerator();