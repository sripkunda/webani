import { Colors } from "../renderer/lighting/colors";
import { Component } from "./component.class";
import { WebaniMesh } from "../objects/webani-mesh.class";
import { Vector3 } from "../types/vector3.type";
import { WebaniMaterial } from "../renderer/lighting/webani-material.class";
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