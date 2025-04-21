import { Colors } from "../../lighting/colors";
import { Vector3 } from "../../types/vector3.type";
import { Component } from "./component.class";
import { WebaniMaterial } from "../../lighting/webani-material.class";
import { BirdMesh } from "./models/models";

export class BirdComponent extends Component {
    objectConstructor(position: Vector3, scale: Vector3, color = Colors.WHITE, opacity = 1) {
        const mesh = BirdMesh.copyCenteredAt(position);
        mesh.scaleBy(scale);
        mesh.material = new WebaniMaterial({ color, opacity });
        return mesh;
    }
}

export const Bird = BirdComponent.GetGenerator();
