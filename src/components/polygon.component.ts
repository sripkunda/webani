import { Colors } from "../renderer/scene/lighting/colors";
import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { WebaniMaterial } from "../renderer/scene/lighting/webani-material.class";

export class PolygonComponent extends Component {
    objectConstructor(points: Vector3[], color = Colors.WHITE, opacity = 1): WebaniPolygon {
        return new WebaniPolygon({
            position: [0, 0, 0], 
            filledPoints: points,
            material: new WebaniMaterial({ color, opacity })
        });
    }
}

export const Polygon = PolygonComponent.GetGenerator();