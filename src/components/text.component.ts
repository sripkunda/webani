import { Colors } from "../renderer/scene/lighting/colors";
import { textToPoints } from "../renderer/util/svg.utils";
import { Component } from "../renderer/scene/component.class";
import { WebaniCollection } from "../renderer/scene/collections/webani-collection.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { VectorUtils } from "../renderer/util/vector.utils";

export type TextComponentOptions = { 
    string: string, 
    position: Vector3, 
    fontSize?: number, 
    material?: WebaniMaterialOptions 
};

export class TextComponent extends Component {
    objectConstructor({ 
        string, 
        position, 
        fontSize = 72, 
        material = { color: Colors.WHITE, opacity: 1 } 
    }: TextComponentOptions): WebaniCollection<WebaniPolygon> {
        const pointsObject = textToPoints(string, fontSize);
        const collection = new WebaniCollection(
            pointsObject.points.map((x, i) => {
                const polygon = new WebaniPolygon({
                    position: [0, 0, 0], 
                    filledPoints: x,
                    holes: pointsObject.holes[i],
                    material: new WebaniMaterial(material)
                });
                return polygon;
            })
        );
        collection.setPosition(VectorUtils.subtract(position, collection.localCenter));
        return collection;
    }
}

export const Text = TextComponent.GetGenerator();