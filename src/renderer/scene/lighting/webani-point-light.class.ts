import { Vector3 } from "../../types/vector3.type";
import { WebaniTransformable } from "../webani-transformable.class";
import { Colors } from "./colors";

/**
 * Options for initializing a WebaniPointLight.
 */
export type WebaniLightOptions = {
    /**
     * The position of the light in 3D space (default is [0, 0, 1]).
     */
    position?: Vector3;
    
    /**
     * The rotation of the light in degrees around each axis (default is [0, 0, 0]).
     */
    rotation?: Vector3;
    
    /**
     * The color of the light, represented as a vector (default is Colors.WHITE).
     */
    color?: Vector3;
    
    /**
     * The intensity of the light (default is 2e+10).
     */
    intensity?: number;
};

/**
 * A point light that emits light in all directions from a single point in 3D space.
 * It is defined by a position, rotation, color, and intensity.
 */
export class WebaniPointLight extends WebaniTransformable {

    /**
     * The color of the light.
     */
    color: Vector3;

    /**
     * The intensity of the light, controlling how bright the light is.
     */
    intensity: number;

    /**
     * Creates a new WebaniPointLight instance with the provided options.
     * @param options The configuration options for the light.
     */
    constructor({
        position = [0, 0, 1],
        rotation = [0, 0, 0],
        color = Colors.WHITE,
        intensity = 2e+10,
    }: WebaniLightOptions = {}) {
        super({
            position,
            rotation,
            scale: [1, 1, 1]
        });
        this.color = color;
        this.intensity = intensity;
    }

    /**
     * Returns the local center of the light, always [0, 0, 0].
     */
    get localCenter(): Vector3 {
        return [0, 0, 0] as Vector3;
    }

    /**
     * Returns the world position of the light, based on its transform.
     */
    get center(): Vector3 { 
        return this.transform.position;
    }
}
