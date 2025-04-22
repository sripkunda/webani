import { Colors } from "../renderer/lighting/colors";
import { Vector3 } from "../types/vector3.type";
import { Component } from "./component.class";
import { WebaniPolygon } from "../objects/webani-polygon.class";
import { WebaniMaterial } from "../renderer/lighting/webani-material.class";

export class PolygonComponent extends Component {
    objectConstructor(points: Vector3[], color = Colors.WHITE, opacity = 1): WebaniPolygon {
        return new WebaniPolygon({
            position: [0, 0, 0], 
            filledPoints: points,
            material: new WebaniMaterial({ color, opacity })
        });
    }
}

export const Polygon = PolygonComponent.GetGenerator();