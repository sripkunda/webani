import { RenderableObject } from "../renderer/types/renderable-object.type";
import { Component } from "../renderer/scene/component.class";
import { Rectangle } from "./rectangle.component";
import { WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { Colors } from "../renderer/scene/lighting/colors";

type SquareComponentOptions = {
    position: Vector3;
    length: number;
    material?: WebaniMaterialOptions; 
};

export class SquareComponent extends Component {
    objectConstructor({ 
        position, 
        length, 
        material = { color: Colors.WHITE, opacity: 1 }
    }: SquareComponentOptions): RenderableObject {
        return Rectangle({
            position,
            length_x: length,
            length_y: length,
            material: material
        });
    }
}

export const Square = SquareComponent.GetGenerator();
