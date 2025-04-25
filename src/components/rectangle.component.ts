import { Colors } from "../renderer/scene/lighting/colors";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { Component } from "../renderer/scene/component.class";
import { Vector2 } from "../renderer/types/vector2.type";
import { WebaniMaterial } from "../renderer/scene/lighting/webani-material.class";

export class RectangleComponent extends Component {
    objectConstructor(position: Vector2, length_x: number, length_y: number, color = Colors.WHITE, opacity = 1) {
        return new WebaniPolygon({
            position: [0, 0, 0],
            filledPoints: [
                [0, 0, 0],
                [length_x, 0, 0],
                [length_x, length_y, 0],
                [0, length_y, 0]
            ],
            material: new WebaniMaterial({
                color, opacity
            })
        }).copyCenteredAt([position[0], position[1], 0]);
    }
}

export const Rectangle = RectangleComponent.GetGenerator();