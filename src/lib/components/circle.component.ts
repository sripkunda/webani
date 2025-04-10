import { Colors } from "../colors";
import { Vector3 } from "../../util/vectors/vector3.type";
import { Component } from "./component.class";
import { WanimPolygonObject } from "../../polygon/wanim-polygon.class";
import { Vector2 } from "../../util/vectors/vector2.type";

export class CircleComponent extends Component {
    objectConstructor(center: Vector2, radius: number, color = Colors.WHITE, opacity = 1): WanimPolygonObject {
        const points: Vector3[] = [];
        const circle = (theta: number): Vector3 => {
            return [center[0] + radius * Math.cos(theta), center[1] + radius * Math.sin(theta), 0];
        };
        let angle = 0;
        const stepSize = (2 * Math.PI) / 1000;
        while (angle < 2 * Math.PI) {
            angle += stepSize;
            points.push(circle(angle));
        }
        return new WanimPolygonObject(points, [], color, opacity).copyCenteredAt([center[0], center[1], 0]);
    }
}

export const Circle = CircleComponent.GetGenerator();
