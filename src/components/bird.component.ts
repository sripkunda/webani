import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { BirdMesh } from "./models/models";

export class BirdComponent extends Component {
    objectConstructor(position: Vector3, scale: number) {
        const mesh = BirdMesh.copyCenteredAt(position);
        mesh.scaleBy([scale, scale, scale]);
        return mesh;
    }
}

export const Bird = BirdComponent.GetGenerator();
