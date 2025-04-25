import { Colors } from "../renderer/scene/lighting/colors";
import { textToPoints } from "../renderer/util/svg.utils";
import { Component } from "../renderer/scene/component.class";
import { WebaniCollection } from "../renderer/scene/collections/webani-collection.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { Vector2 } from "../renderer/types/vector2.type";
import { WebaniMaterial } from "../renderer/scene/lighting/webani-material.class";

export class TextComponent extends Component {
    objectConstructor(string: string, position: Vector2, fontSize = 72, color = Colors.WHITE, opacity = 1): WebaniCollection {
        const pointsObject = textToPoints(string, fontSize);
        return new WebaniCollection(
            pointsObject.points.map((x, i) => {
                const polygon = new WebaniPolygon({
                    position, 
                    filledPoints: x,
                    holes: pointsObject.holes[i],
                    material: new WebaniMaterial({
                        color, opacity
                    })
                });
                    return polygon;
            })
        ).copyCenteredAt([position[0], position[1], 0]);
    }
}

export const Text = TextComponent.GetGenerator();
