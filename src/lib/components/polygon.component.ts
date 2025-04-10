import { Colors } from "../colors";
import { Vector3 } from "../../util/vectors/vector3.type";
import { Component } from "./component.class";
import { WanimPolygonObject } from "../../polygon/wanim-polygon.class";

export class PolygonComponent extends Component {
    objectConstructor(points: Vector3[], color = Colors.WHITE, opacity = 1): WanimPolygonObject {
        return new WanimPolygonObject(points, [], color, opacity);
    }
}

export const Polygon = PolygonComponent.GetGenerator();