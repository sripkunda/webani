import { Colors } from "../lib/colors";
import { ObjectLike } from "../objects/object-like.type";
import { WanimObject } from "../objects/wanim-object.class";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";

export class RectangleComponent extends Component {
    objectConstructor(position: Vector, length_x: number, length_y: number, color = Colors.WHITE, opacity = 1): WanimObject {
        return new WanimObject(
            [
                [position[0], position[1]],
                [position[0] + length_x, position[1]],
                [position[0] + length_x, position[1] + length_y],
                [position[0], position[1] + length_y]
            ],
            [],
            color,
            opacity
        ).copyCenteredAt(position);
    }
}

export const Rectangle = RectangleComponent.GetGenerator();