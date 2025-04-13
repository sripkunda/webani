import { Colors } from "../colors";
import { ObjectLike } from "../../objects/object-like.type";
import { Component } from "./component.class";
import { Rectangle } from "./rectangle.component";
import { Vector2 } from "../../util/vectors/vector2.type";

export class LineComponent extends Component {
    objectConstructor(position: Vector2, length: number, angle = 0, thickness = 2, color = Colors.WHITE, opacity = 1): ObjectLike {
        return Rectangle(position, length, Math.max(2, thickness), color, opacity).SetCenterPosition([position[0] + length / 2, position[1], 0]).SetRotation([0, 0, angle], [position[0], position[1], 0]);
    }
}

export const Line = LineComponent.GetGenerator();