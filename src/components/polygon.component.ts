import { Colors } from "../renderer/scene/lighting/colors";
import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";

type PolygonComponentOptions = {
    points: Vector3[];
    material?: WebaniMaterialOptions; 
};

export class PolygonComponent extends Component {
    objectConstructor({ 
        points, 
        material = { color: Colors.WHITE, opacity: 1 } 
    }: PolygonComponentOptions): WebaniPolygon {
        return new WebaniPolygon({
            position: [0, 0, 0], 
            filledPoints: points,
            material: new WebaniMaterial(material)
        });
    }
}

export const Polygon = PolygonComponent.GetGenerator();
