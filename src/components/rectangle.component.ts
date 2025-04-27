import { Colors } from "../renderer/scene/lighting/colors";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { Component } from "../renderer/scene/component.class";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";

type RectangleComponentOptions = {
    position: Vector3;
    length_x: number;
    length_y: number;
    material?: WebaniMaterialOptions;
};

export class RectangleComponent extends Component {
    objectConstructor({ 
        position,
        length_x,
        length_y,
        material = { color: Colors.WHITE, opacity: 1 }
    }: RectangleComponentOptions) {
        return new WebaniPolygon({
            position: position,
            filledPoints: [
                [-length_x / 2, -length_y / 2, 0],
                [ length_x / 2, -length_y / 2, 0],
                [ length_x / 2,  length_y / 2, 0],
                [-length_x / 2,  length_y / 2, 0]  
            ],
            material: new WebaniMaterial(material)
        });
    }
}

export const Rectangle = RectangleComponent.GetGenerator();