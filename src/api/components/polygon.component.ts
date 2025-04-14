import { Colors } from "../../lighting/colors";
import { Vector3 } from "../../types/vector3.type";
import { Component } from "./component.class";
import { WebaniPolygon } from "../../polygon/webani-polygon.class";
import { WebaniMaterial } from "../../lighting/webani-material.class";

export class PolygonComponent extends Component {
    objectConstructor(points: Vector3[], color = Colors.WHITE, opacity = 1): WebaniPolygon {
        const object = new WebaniPolygon([0, 0, 0], points, []);
        object.material = WebaniMaterial.fromColorAndOpacity(color, opacity);
        return object;
    }
}

export const Polygon = PolygonComponent.GetGenerator();