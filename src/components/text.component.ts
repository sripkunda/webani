import { Colors } from "../lib/colors";
import { textToPoints } from "../util/utils";
import { Vector } from "../util/vector.type";
import { Component } from "./component.class";
import { WanimCollection } from "../objects/wanim-collection.class";
import { WanimObject } from "../objects/wanim-object.class";
export class TextComponent extends Component {
    objectConstructor(string: string, position: Vector, fontSize = 72, color = Colors.WHITE, opacity = 1): WanimCollection {
        const pointsObject = textToPoints(string, position, fontSize);
        return new WanimCollection(
            pointsObject.points.map(
                (x, i) => new WanimObject(x, pointsObject.holes[i], color, opacity, [0, 0, 0])
            )
        ).copyCenteredAt(position);
    }
}

export const Text = TextComponent.GetGenerator();
