import { Colors } from "../renderer/scene/lighting/colors";
import { RenderableObject } from "../renderer/types/renderable-object.type";
import { Component } from "../renderer/scene/component.class";
import { Rectangle } from "./rectangle.component";
import { Vector2 } from "../renderer/types/vector2.type";
import { WebaniMaterial } from "../renderer/scene/lighting/webani-material.class";

export class SquareComponent extends Component {
    objectConstructor(position: Vector2, length: number, color = Colors.WHITE, opacity = 1): RenderableObject {
        return Rectangle(position, length, length, color, opacity);
    }
}

export const Square = SquareComponent.GetGenerator();