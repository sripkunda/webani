import { Colors } from "../colors";
import { ObjectLike } from "../../objects/object-like.type";
import { Component } from "./component.class";
import { Rectangle } from "./rectangle.component";
import { Vector2 } from "../../util/vectors/vector2.type";

export class SquareComponent extends Component {
    objectConstructor(position: Vector2, length: number, color = Colors.WHITE, opacity = 1): ObjectLike {
        return Rectangle(position, length, length, color, opacity);
    }
}

export const Square = SquareComponent.GetGenerator();