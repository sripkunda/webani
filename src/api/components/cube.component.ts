import { Colors } from "../../lighting/colors";
import { Component } from "./component.class";
import { WebaniMesh } from "../../objects/webani-mesh.class";
import { Vector3 } from "../../types/vector3.type";
import { WebaniMaterial } from "../../lighting/webani-material.class";

export class CubeComponent extends Component {
    objectConstructor(position: Vector3, length: number, color = Colors.WHITE, opacity = 1) {
        const mesh = new WebaniMesh(
            position, 
            [
                // +X face
                [ length,  length, -length], [ length, -length, -length], [ length, -length,  length],
                [ length, -length,  length], [ length,  length,  length], [ length,  length, -length],
              
                // -X face
                [-length,  length,  length], [-length, -length,  length], [-length, -length, -length],
                [-length, -length, -length], [-length,  length, -length], [-length,  length,  length],
              
                // +Y face
                [-length,  length, -length], [ length,  length, -length], [ length,  length,  length],
                [ length,  length,  length], [-length,  length,  length], [-length,  length, -length],
              
                // -Y face
                [-length, -length,  length], [ length, -length,  length], [ length, -length, -length],
                [ length, -length, -length], [-length, -length, -length], [-length, -length,  length],
              
                // +Z face
                [-length,  length,  length], [ length,  length,  length], [ length, -length,  length],
                [ length, -length,  length], [-length, -length,  length], [-length,  length,  length],
              
                // -Z face
                [ length,  length, -length], [-length,  length, -length], [-length, -length, -length],
                [-length, -length, -length], [ length, -length, -length], [ length,  length, -length]
            ],
            [
                // +X face normals
                [1, 0, 0], [1, 0, 0], [1, 0, 0],
                [1, 0, 0], [1, 0, 0], [1, 0, 0],
        
                // -X face normals
                [-1, 0, 0], [-1, 0, 0], [-1, 0, 0],
                [-1, 0, 0], [-1, 0, 0], [-1, 0, 0],
        
                // +Y face normals
                [0, 1, 0], [0, 1, 0], [0, 1, 0],
                [0, 1, 0], [0, 1, 0], [0, 1, 0],
        
                // -Y face normals
                [0, -1, 0], [0, -1, 0], [0, -1, 0],
                [0, -1, 0], [0, -1, 0], [0, -1, 0],
        
                // +Z face normals
                [0, 0, 1], [0, 0, 1], [0, 0, 1],
                [0, 0, 1], [0, 0, 1], [0, 0, 1],
        
                // -Z face normals
                [0, 0, -1], [0, 0, -1], [0, 0, -1],
                [0, 0, -1], [0, 0, -1], [0, 0, -1]
            ]
        ).copyCenteredAt([0, 0, 0]);
        mesh.material = WebaniMaterial.fromColorAndOpacity(color, opacity);
        return mesh;
    }
}

export const Cube = CubeComponent.GetGenerator();