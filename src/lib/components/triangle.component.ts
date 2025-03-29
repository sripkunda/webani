import { Colors } from "../colors";
import { Vector } from "../../util/vector.type";
import { Component } from "./component.class";
import { WanimObject } from "../../objects/wanim-object.class";

export class TriangleComponent extends Component {
    objectConstructor(points: Vector[], color = Colors.WHITE, opacity = 1): WanimObject {
        return new WanimObject(points, [], color, opacity);
    }
}

export const Triangle = TriangleComponent.GetGenerator();