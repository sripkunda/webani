import { Component } from "../renderer/scene/component.class";
import { Line } from "./line.component";
import { WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { Colors } from "../renderer/scene/lighting/colors";

type ConnectingLineComponentOptions = {
    start: Vector3;
    end: Vector3;
    thickness?: number;
    material?: WebaniMaterialOptions;
};

export class ConnectingLineComponent extends Component {
    objectConstructor({ 
        start, 
        end, 
        thickness = 5, 
        material = { color: Colors.WHITE, opacity: 1 }
    }: ConnectingLineComponentOptions) {
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
        const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        
        return Line({
            position: start,
            length,
            angle,
            thickness,
            material
        });
    }
}

export const ConnectingLine = ConnectingLineComponent.GetGenerator();
