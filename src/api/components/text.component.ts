import { Colors } from "../colors";
import { textToPoints } from "../../util/svg/svg.utils";
import { Component } from "./component.class";
import { LorentzCollection } from "../../objects/lorentz-collection.class";
import { LorentzPolygon } from "../../polygon/lorentz-polygon.class";
import { Vector2 } from "../../util/vectors/vector2.type";

export class TextComponent extends Component {
    objectConstructor(string: string, position: Vector2, fontSize = 0.5, color = Colors.WHITE, opacity = 1): LorentzCollection {
        const pointsObject = textToPoints(string, fontSize);
        return new LorentzCollection(
            pointsObject.points.map(
                (x, i) => new LorentzPolygon(position, x, pointsObject.holes[i], color)
            )
        ).setAnchor([0, 0, 0]);
    }
}

export const Text = TextComponent.GetGenerator();
