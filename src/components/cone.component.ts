import { Colors } from "../renderer/scene/lighting/colors";
import { WebaniMaterial, WebaniMaterialOptions } from "../renderer/scene/lighting/webani-material.class";
import { Vector3 } from "../renderer/types/vector3.type";
import { Component } from "../renderer/scene/component.class";
import { ConeMesh } from "./models/models";

/**
 * Options for creating a cone component.
 */
type ConeComponentOptions = {
    /** The base position of the cone in 3D space. */
    position: Vector3;

    /** The radius of the cone's base. */
    radius: number;

    /** The height of the cone. */
    height: number;

    /** Optional material properties for the cone surface. */
    material?: WebaniMaterialOptions;
};

/**
 * A component that generates a 3D cone mesh.
 *
 * This extends the `Component` base class and uses a predefined cone mesh.
 * The mesh is shallow-copied, positioned, scaled, and optionally styled
 * with a custom material.
 */
export class ConeComponent extends Component {
    /**
     * Constructs a cone mesh using the provided options.
     *
     * @param options - Configuration object containing position, radius, height, and optional material.
     * @returns A transformed `ConeMesh` instance with applied properties.
     */
    objectConstructor({
        position,
        radius,
        height,
        material = { color: Colors.WHITE, opacity: 1 }
    }: ConeComponentOptions) {
        const mesh = ConeMesh.shallowCopy;
        mesh.overridePosition(position);
        mesh.scaleBy([radius, height, radius]);
        mesh.objectArray[0].material = new WebaniMaterial(material);
        return mesh;
    }
}

/**
 * A reusable generator instance for creating cone components.
 */
export const Cone = ConeComponent.GetGenerator();
