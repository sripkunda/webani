import { Colors } from "../renderer/scene/lighting/colors";
import { WebaniMaterial } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { BirdMesh, ConeMesh } from "./models/models";

export class ConeComponent extends Component {
    objectConstructor(position: Vector3, radius: number, height: number, color = Colors.WHITE, opacity = 1) {
        const mesh = ConeMesh.copyCenteredAt(position);
        mesh.scaleBy([radius, height, radius]);
        mesh.material = new WebaniMaterial({ color, opacity });
        return mesh;
    }
}

export const Cone = ConeComponent.GetGenerator();
