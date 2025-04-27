import { Colors } from "../renderer/scene/lighting/colors";
import { RenderableObject } from "../renderer/types/renderable-object.type";
import { Component } from "../renderer/scene/component.class";
import { Rectangle } from "./rectangle.component";
import { WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";

type LineComponentOptions = {
    position: Vector3;
    length: number;
    angle?: number;
    thickness?: number;
    material?: WebaniMaterialOptions; 
};

export class LineComponent extends Component {
    objectConstructor({ 
        position, 
        length, 
        angle = 0, 
        thickness = 2, 
        material = { color: Colors.WHITE, opacity: 1 }
    }: LineComponentOptions): RenderableObject {
        return Rectangle({
            position,
            length_x: length,
            length_y: Math.max(2, thickness),
            material: material
        }).ChangeRotation([0, 0, angle], [position[0], position[1], 0]);
    }
}

export const Line = LineComponent.GetGenerator();