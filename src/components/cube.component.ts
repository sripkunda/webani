import { Colors } from "../renderer/lighting/colors";
import { Component } from "./component.class";
import { WebaniMesh } from "../objects/webani-mesh.class";
import { Vector3 } from "../types/vector3.type";
import { WebaniMaterial } from "../renderer/lighting/webani-material.class";

export class CubeComponent extends Component {
    objectConstructor(position: Vector3, length: number, color = Colors.BLACK, opacity = 1) {
        return new WebaniMesh({
            position, 
            triangleVertices: [
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
            vertexNormals: [
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
            ],
            material: new WebaniMaterial({ color, opacity })
        }).copyCenteredAt([0, 0, 0]);
    }
}

export const Cube = CubeComponent.GetGenerator();