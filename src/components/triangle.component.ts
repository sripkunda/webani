import { Colors } from "../lib/colors";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";
import { WanimObject } from "../objects/wanim-object.class";
import { GetGenerator } from "../util/utils";

export class TriangleComponent extends Component {
    objectConstructor(points: Vector[], color = Colors.WHITE, opacity = 1): WanimObject {
        return new WanimObject(points, [], color, opacity);
    }
}

export const Triangle = GetGenerator(TriangleComponent);