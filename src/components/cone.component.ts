import { Colors } from "../renderer/scene/lighting/colors";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { ConeMesh } from "./models/models";

type ConeComponentOptions = {
    position: Vector3;
    radius: number;
    height: number;
    material?: WebaniMaterialOptions;
};

export class ConeComponent extends Component {
    objectConstructor({
        position,
        radius,
        height,
        material = { color: Colors.WHITE, opacity: 1 }
    }: ConeComponentOptions) {
        const mesh = ConeMesh.shallowCopy;
        mesh.setPosition(position);
        mesh.scaleBy([radius, height, radius]);
        mesh.objectArray[0].material = new WebaniMaterial(material);
        return mesh;
    }
}

export const Cone = ConeComponent.GetGenerator();
