import { Colors } from "../colors";
import { Vector3 } from "../../types/vector3.type";
import { Component } from "./component.class";
import { WebaniPolygon } from "../../polygon/webani-polygon.class";
import { Vector2 } from "../../types/vector2.type";
import { WebaniMaterial } from "../../lighting/webani-material.class";

export class CircleComponent extends Component {
    objectConstructor(center: Vector2, radius: number, color = Colors.WHITE, opacity = 1): WebaniPolygon {
        const points: Vector3[] = [];
        const circle = (theta: number): Vector3 => {
            return [radius * Math.cos(theta), radius * Math.sin(theta), 0];
        };
        let angle = 0;
        const stepSize = (2 * Math.PI) / 1000;
        while (angle < 2 * Math.PI) {
            angle += stepSize;
            points.push(circle(angle));
        }
        const object = new WebaniPolygon(center, points, []);
        object.material = WebaniMaterial.fromColorAndOpacity(color, opacity);
        return object;
    }
}

export const Circle = CircleComponent.GetGenerator();
