import { Colors } from "../renderer/scene/lighting/colors";
import { Component } from "../renderer/scene/component.class";
import { WebaniMesh } from "../renderer/scene/meshes/webani-mesh.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";

/**
 * Options for creating a cube component.
 */
type CubeComponentOptions = {
    /** The center position of the cube in 3D space. */
    position: Vector3;

    /** Half the edge length of the cube (defines its scale). */
    length: number;

    /** Optional material to style the cube's surface. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that creates a 3D cube mesh using 12 triangles (2 per face).
 *
 * Extends `Component` and returns a `WebaniMesh` with hardcoded triangle geometry
 * and normals for all six cube faces.
 */
export class CubeComponent extends Component {
    /**
     * Constructs a cube mesh based on the provided position, size, and material.
     *
     * @param options - Configuration object with position, length, and optional material.
     * @returns A `WebaniMesh` representing the cube geometry.
     */
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

/**
 * A reusable generator instance for creating cube components.
 */
export const Cube = CubeComponent.GetGenerator();