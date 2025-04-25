import { Colors } from "../renderer/scene/lighting/colors";
import { Component } from "../renderer/scene/component.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { WebaniMaterial } from "../renderer/scene/lighting/webani-material.class";
import { SphereMesh } from "./models/models";


export class SphereComponent extends Component {
    objectConstructor(position: Vector3, radius: number, color = Colors.BLACK, opacity = 1) {
        const mesh = SphereMesh.copyCenteredAt(position);
        mesh.scaleBy([radius, radius, radius]);
        mesh.material = new WebaniMaterial({color, opacity});
        return mesh;
    }
}

export const Sphere = SphereComponent.GetGenerator();