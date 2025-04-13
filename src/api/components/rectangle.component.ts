import { Colors } from "../colors";
import { LorentzPolygon } from "../../polygon/lorentz-polygon.class";
import { Component } from "./component.class";
import { Vector2 } from "../../util/vectors/vector2.type";

export class RectangleComponent extends Component {
    objectConstructor(position: Vector2, length_x: number, length_y: number, color = Colors.WHITE, opacity = 1) {
        return new LorentzPolygon(
            position,
            [
                [0, 0, 0],
                [length_x, 0, 0],
                [length_x, length_y, 0],
                [0, length_y, 0]
            ],
            [],
        ).copyCenteredAt([0, 0, 0]);
    }
}

export const Rectangle = RectangleComponent.GetGenerator();