import { Colors } from "../renderer/scene/lighting/colors";
import { Component } from "../renderer/scene/component.class";
import { WebaniMesh } from "../renderer/scene/meshes/webani-mesh.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";

type CubeComponentOptions = {
    position: Vector3;
    length: number;
    material?: WebaniMaterialOptions;  // Added to allow material customization
};

export class CubeComponent extends Component {
    objectConstructor({ 
        position, 
        length, 
        material = { color: Colors.BLACK, opacity: 1 } 
    }: CubeComponentOptions) {
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
            material: new WebaniMaterial(material)
        });
    }
}

export const Cube = CubeComponent.GetGenerator();
