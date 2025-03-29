import { Colors } from "../lib/colors";
import { ObjectLike } from "../objects/object-like.type";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";
import { Line, LineComponent } from "./line.component";

export class ConnectingLineComponent extends Component {
    objectConstructor(start: Vector, end: Vector, thickness = 5, color = Colors.WHITE, opacity = 1): ObjectLike {
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        return Line(start, length, angle, thickness, color, opacity);
    }
}

export const ConnectingLine = ConnectingLineComponent.GetGenerator();