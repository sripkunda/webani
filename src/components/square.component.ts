import { Colors } from "../lib/colors";
import { ObjectLike } from "../objects/object-like.type";
import { GetGenerator } from "../util/utils";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";
import { Rectangle } from "./rectangle.component";

class SquareComponent extends Component {
    objectConstructor(position: Vector, length: number, color = Colors.WHITE, opacity = 1): ObjectLike {
        return Rectangle(position, length, length, color, opacity)
            .copyCenteredAt([position[0] + length / 2, position[1] + length / 2]);
    }
}

export const Square = GetGenerator(SquareComponent);