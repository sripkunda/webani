import { Colors } from "../../lighting/colors";
import { textToPoints } from "../../util/svg.utils";
import { Component } from "./component.class";
import { WebaniCollection } from "../../objects/webani-collection.class";
import { WebaniPolygon } from "../../polygon/webani-polygon.class";
import { Vector2 } from "../../types/vector2.type";

export class TextComponent extends Component {
    objectConstructor(string: string, position: Vector2, fontSize = 72, color = Colors.WHITE, opacity = 1): WebaniCollection {
        const pointsObject = textToPoints(string, fontSize);
        return new WebaniCollection(
            pointsObject.points.map(
                (x, i) => new WebaniPolygon(position, x, pointsObject.holes[i], color)
            )
        ).setAnchor([position[0], position[1], 0]);
    }
}

export const Text = TextComponent.GetGenerator();
