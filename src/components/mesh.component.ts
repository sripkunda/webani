import { Component } from "../renderer/scene/component.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { WebaniCollection } from "../renderer/scene/collections/webani-collection.class";
import { WebaniMesh } from "../renderer/scene/meshes/webani-mesh.class";

export type MeshComponentOptions = {
    mesh: WebaniCollection<WebaniMesh>;
    position?: Vector3;
    scale?: Vector3;
};

export class MeshComponent extends Component {
    objectConstructor({
        position = [0, 0, 0],
        mesh,
        scale = [1, 1, 1]
    }: MeshComponentOptions) {
        const copy = mesh.shallowCopy;
        copy.setPosition(position);
        copy.scaleBy(scale);
        return copy;
    }
}

export const Mesh = MeshComponent.GetGenerator();