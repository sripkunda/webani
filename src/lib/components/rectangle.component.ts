import { Colors } from "../colors";
import { WanimPolygonObject } from "../../polygon/wanim-polygon.class";
import { Component } from "./component.class";
import { Vector2 } from "../../util/vectors/vector2.type";

export class RectangleComponent extends Component {
    objectConstructor(position: Vector2, length_x: number, length_y: number, color = Colors.WHITE, opacity = 1): WanimPolygonObject {
        return new WanimPolygonObject(
            [
                [position[0], position[1], 0],
                [position[0] + length_x, position[1], 0],
                [position[0] + length_x, position[1] + length_y, 0],
                [position[0], position[1] + length_y, 0]
            ],
            [],
            color,
            opacity
        ).copyCenteredAt([position[0], position[1], 0]);
    }
}

export const Rectangle = RectangleComponent.GetGenerator();