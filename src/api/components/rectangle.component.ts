import { Colors } from "../../lighting/colors";
import { WebaniPolygon } from "../../polygon/webani-polygon.class";
import { Component } from "./component.class";
import { Vector2 } from "../../types/vector2.type";
import { WebaniMaterial } from "../../lighting/webani-material.class";

export class RectangleComponent extends Component {
    objectConstructor(position: Vector2, length_x: number, length_y: number, color = Colors.WHITE, opacity = 1, material?: WebaniMaterial) {
        const polygon = new WebaniPolygon(
            [0, 0, 0],
            [
                [0, 0, 0],
                [length_x, 0, 0],
                [length_x, length_y, 0],
                [0, length_y, 0]
            ],
            [],
        ).copyCenteredAt([position[0], position[1], 0]);
        polygon.material = material || WebaniMaterial.fromColorAndOpacity(color, opacity);
        return polygon;
    }
}

export const Rectangle = RectangleComponent.GetGenerator();