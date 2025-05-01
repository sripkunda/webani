import { RenderableObject } from "../renderer/types/renderable-object.type";
import { Component } from "../renderer/scene/component.class";
import { Rectangle } from "./rectangle.component";
import { WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { Colors } from "../renderer/scene/lighting/colors";

/**
 * Options for creating a square component.
 */
export type SquareComponentOptions = {
    /** The position of the square in 3D space. */
    position: Vector3;

    /** The length of the square's sides. */
    length: number;

    /** Optional material to style the square. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that creates a 3D square by generating a rectangle with equal side lengths.
 * 
 * This component uses the `Rectangle` component, where both the `length_x` and `length_y` parameters are
 * set to the same value, ensuring that the result is a square.
 */
export class SquareComponent extends Component {
    /**
     * Constructs a `RenderableObject` representing a square, by creating a rectangle with equal side lengths.
     * 
     * @param options - Configuration object containing the position, length, and optional material.
     * @returns A `RenderableObject` instance representing the square.
     */
    objectConstructor({ 
        position, 
        length, 
        material = { color: Colors.WHITE, opacity: 1 }
    }: SquareComponentOptions): RenderableObject {
        return Rectangle({
            position,
            length_x: length,
            length_y: length,
            material: material
        });
    }
}

/**
 * A reusable generator instance for creating square components.
 */
export const Square = SquareComponent.GetGenerator();
