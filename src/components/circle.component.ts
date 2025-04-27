import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { WebaniPolygon } from "../renderer/scene/polygons/webani-polygon.class";
import { Vector2 } from "../renderer/types/vector2.type";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Colors } from "../renderer/scene/lighting/colors";

type CircleComponentOptions = {
    center: Vector2;
    radius: number;
    material?: WebaniMaterialOptions
};

export class CircleComponent extends Component {
    objectConstructor({
        center,
        radius,
        material = { color: Colors.WHITE, opacity: 1 }
    }: CircleComponentOptions): WebaniPolygon {
        const points: Vector3[] = [];
        const circle = (theta: number): Vector3 => [
            radius * Math.cos(theta),
            radius * Math.sin(theta),
            0
        ];
        
        let angle = 0;
        const stepSize = (2 * Math.PI) / 1000;
        while (angle < 2 * Math.PI) {
            angle += stepSize;
            points.push(circle(angle));
        }

        return new WebaniPolygon({
            position: center,
            filledPoints: points,
            material: new WebaniMaterial(material)
        });
    }
}

export const Circle = CircleComponent.GetGenerator();