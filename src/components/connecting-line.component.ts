import { RenderableObject } from "../types/renderable-object.type";
import { Component } from "./component.class";
import { Line } from "./line.component";
import { Vector2 } from "../types/vector2.type";
import { Colors } from "../renderer/scene/lighting/colors";

export class ConnectingLineComponent extends Component {
    objectConstructor(start: Vector2, end: Vector2, thickness = 5, color = Colors.WHITE, opacity = 1): RenderableObject {
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        return Line(start, length, angle, thickness, color, opacity);
    }
}

export const ConnectingLine = ConnectingLineComponent.GetGenerator();