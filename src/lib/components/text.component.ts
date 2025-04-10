import { Colors } from "../colors";
import { textToPoints } from "../../util/svg/svg.utils";
import { Component } from "./component.class";
import { WanimCollection } from "../../objects/wanim-collection.class";
import { WanimPolygonObject } from "../../polygon/wanim-polygon.class";
import { Vector2 } from "../../util/vectors/vector2.type";

export class TextComponent extends Component {
    objectConstructor(string: string, position: Vector2, fontSize = 72, color = Colors.WHITE, opacity = 1): WanimCollection {
        const pointsObject = textToPoints(string, position, fontSize);
        return new WanimCollection(
            pointsObject.points.map(
                (x, i) => new WanimPolygonObject(x, pointsObject.holes[i], color, opacity, [0, 0, 0])
            )
        ).copyCenteredAt([position[0], position[1], 0]);
    }
}

export const Text = TextComponent.GetGenerator();
