import { Component } from "../renderer/scene/component.class";
import { Line } from "./line.component";
import { WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { Colors } from "../renderer/scene/lighting/colors";

/**
 * Options for creating a connecting line between two 3D points.
 */
type ConnectingLineComponentOptions = {
    /** Starting point of the line in 3D space. */
    start: Vector3;

    /** Ending point of the line in 3D space. */
    end: Vector3;

    /** Optional thickness of the line. Default is `5`. */
    thickness?: number;

    /** Optional material for line styling. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that creates a line between two 3D points.
 * 
 * Computes the angle and length from the start and end vectors, then
 * delegates to the base `Line` component.
 */
export class ConnectingLineComponent extends Component {
    /**
     * Constructs a `Line` between the start and end points.
     *
     * @param options - Configuration object with start, end, optional thickness and material.
     * @returns A `Line` component positioned and rotated to match the input vectors.
     */
    objectConstructor({ 
        start, 
        end, 
        thickness = 5, 
        material = { color: Colors.WHITE, opacity: 1 }
    }: ConnectingLineComponentOptions) {
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
        const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        
        return Line({
            position: start,
            length,
            angle,
            thickness,
            material
        });
    }
}

/**
 * A reusable generator instance for creating connecting line components.
 */
export const ConnectingLine = ConnectingLineComponent.GetGenerator();