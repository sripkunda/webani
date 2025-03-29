import { Colors } from "../lib/colors";
import { ObjectLike } from "../objects/object-like.type";
import { GetGenerator } from "../util/utils";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";
import { Rectangle } from "./rectangle.component";

class LineComponent extends Component {
    objectConstructor(position: Vector, length: number, angle = 0, thickness = 2, color = Colors.WHITE, opacity = 1): ObjectLike {
        return Rectangle(position, length, Math.max(2, thickness), color, opacity)
            .copyCenteredAt([position[0] + length / 2, position[1]])
            .rotatedCopy(angle, position);
    }
}

export const Line = GetGenerator(LineComponent);