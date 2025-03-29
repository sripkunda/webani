import { Colors } from "../lib/colors";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";
import { WanimObject } from "../objects/wanim-object.class";

export class CircleComponent extends Component {
    objectConstructor(center: Vector, radius: number, color = Colors.WHITE, opacity = 1): WanimObject {
        const points: Vector[] = [];
        const circle = (theta: number): Vector => {
            return [center[0] + radius * Math.cos(theta), center[1] + radius * Math.sin(theta)];
        };
        let angle = 0;
        const stepSize = (2 * Math.PI) / 1000;
        while (angle < 2 * Math.PI) {
            angle += stepSize;
            points.push(circle(angle));
        }
        return new WanimObject(points, [], color, opacity).copyCenteredAt(center);
    }
}

export const Circle = CircleComponent.GetGenerator();
