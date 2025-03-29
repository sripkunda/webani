import { Colors } from "../lib/colors";
import { ObjectLike } from "../objects/object-like.type";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";
import { Rectangle } from "./rectangle.component";

export class SquareComponent extends Component {
    objectConstructor(position: Vector, length: number, color = Colors.WHITE, opacity = 1): ObjectLike {
        return Rectangle(position, length, length, color, opacity);
    }
}

export const Square = SquareComponent.GetGenerator();