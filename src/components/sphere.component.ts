import { Colors } from "../renderer/scene/lighting/colors";
import { Component } from "../renderer/scene/component.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { SphereMesh } from "./models/models";
import { WebaniMesh } from "../renderer/scene/meshes/webani-mesh.class";

type SphereComponentOptions = {
    position: Vector3;
    radius: number;
    material?: WebaniMaterialOptions; 
};

export class SphereComponent extends Component {
    objectConstructor({ 
        position, 
        radius, 
        material = { color: Colors.BLACK, opacity: 1 } 
    }: SphereComponentOptions) {
        const mesh = SphereMesh.shallowCopy;
        mesh.setPosition(position);
        mesh.scaleBy([radius, radius, radius]);
        
        (mesh.objectArray[0] as WebaniMesh).material = new WebaniMaterial(material);
        
        return mesh;
    }
}

export const Sphere = SphereComponent.GetGenerator();