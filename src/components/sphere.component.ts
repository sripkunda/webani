import { Colors } from "../renderer/scene/lighting/colors";
import { Component } from "../renderer/scene/component.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { SphereMesh } from "./models/models";
import { WebaniMesh } from "../renderer/scene/meshes/webani-mesh.class";

/**
 * Options for creating a sphere component.
 */
type SphereComponentOptions = {
    /** The position of the sphere in 3D space. */
    position: Vector3;

    /** The radius of the sphere. */
    radius: number;

    /** Optional material to style the sphere. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that generates a 3D sphere mesh.
 * 
 * The sphere is created using a shallow copy of the `SphereMesh` model, scaled by the specified radius
 * and positioned at the provided location. The material can be customized, with a default black material.
 */
export class SphereComponent extends Component {
    /**
     * Constructs a `WebaniMesh` representing a sphere, positioned and scaled according to the provided options.
     * 
     * @param options - Configuration object containing the position, radius, and optional material.
     * @returns A `WebaniMesh` instance representing the sphere.
     */
    objectConstructor({ 
        position, 
        radius, 
        material = { color: Colors.BLACK, opacity: 1 } 
    }: SphereComponentOptions) {
        const mesh = SphereMesh.shallowCopy;
        mesh.overridePosition(position);
        mesh.scaleBy([radius, radius, radius]);
        
        (mesh.objectArray[0] as WebaniMesh).material = new WebaniMaterial(material);
        
        return mesh;
    }
}

/**
 * A reusable generator instance for creating sphere components.
 */
export const Sphere = SphereComponent.GetGenerator();
