import { Colors } from "../../lighting/colors";
import { RenderableObject } from "../../types/renderable-object.type";
import { Component } from "./component.class";
import { Rectangle } from "./rectangle.component";
import { Vector2 } from "../../types/vector2.type";
import { WebaniMaterial } from "../../lighting/webani-material.class";

export class SquareComponent extends Component {
    objectConstructor(position: Vector2, length: number, color = Colors.WHITE, opacity = 1, material?: WebaniMaterial): RenderableObject {
        return Rectangle(position, length, length, color, opacity, material);
    }
}

export const Square = SquareComponent.GetGenerator();