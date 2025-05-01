import { VectorUtils } from "../util/vector.utils";
import { WebaniPerspectiveCamera } from "./camera/webani-perspective-camera.class";
import { WebaniCollection } from "./collections/webani-collection.class";
import { WebaniPointLight } from "./lighting/webani-point-light.class";
import { WebaniTransformable } from "./webani-transformable.class";

/**
 * The `WebaniScene` class represents a 3D scene that contains various objects, lights, and a camera.
 * This class is responsible for managing objects to be rendered and lights in the scene, as well as the camera.
 */
export class WebaniScene {

    /**
     * A list of transformable objects in the scene.
     */
    _members: WebaniTransformable[] = [];

    /**
     * A list of point lights in the scene.
     */
    _lights: WebaniPointLight[] = [];

    /**
     * The main camera of the scene.
     */
    _mainCamera: WebaniPerspectiveCamera;

    /**
     * The positions of all lights in the scene stored in a flat `Float32Array`.
     */
    _lightPositions: Float32Array;

    /**
     * The colors of all lights in the scene stored in a flat `Float32Array`.
     */
    _lightColors: Float32Array;

    /**
     * The intensities of all lights in the scene stored in a flat `Float32Array`.
     */
    _lightIntensities: Float32Array;

    /**
     * Creates a new `WebaniScene` with an optional set of transformable objects.
     * Automatically creates a main camera and adds a default point light.
     * 
     * @param members - A list of `WebaniTransformable` objects to add to the scene.
     */
    constructor(...members: WebaniTransformable[]) {
        this._members = members;
        this._mainCamera = new WebaniPerspectiveCamera();
        this.addLight(new WebaniPointLight());
    }

    /**
     * The main camera of the scene.
     * 
     * @returns The `WebaniPerspectiveCamera` instance.
     */
    get camera() {
        return this._mainCamera;
    }

    /**
     * The number of lights in the scene.
     * 
     * @returns The number of lights as a number.
     */
    get numLights(): number {
        return this._lights.length;
    }

    /**
     * The positions of all the lights in the scene.
     * 
     * @returns A `Float32Array` containing the positions of the lights.
     */
    get lightPositions(): Float32Array { 
        return this._lightPositions;
    }

    /**
     * The colors of all the lights in the scene.
     * 
     * @returns A `Float32Array` containing the colors of the lights.
     */
    get lightColors(): Float32Array {
        return this._lightColors;
    }

    /**
     * The intensities of all the lights in the scene.
     * 
     * @returns A `Float32Array` containing the intensities of the lights.
     */
    get lightIntensities(): Float32Array { 
        return this._lightIntensities;
    }

    /**
     * Retrieves all objects in the scene that are ready to be rendered.
     * It includes transformable objects, lights, and cameras.
     * 
     * @returns An array of `WebaniTransformable` objects for rendering.
     */
    get getObjectsForRender(): WebaniTransformable[] {
        const objectList = [];

        const addObjectsToList = (...objects: WebaniTransformable[]) => { 
            for (const object of objects) { 
                if (object instanceof WebaniPerspectiveCamera) { 
                    this.setCamera(object);
                } else if (object instanceof WebaniPointLight) { 
                    this.addLight(object);
                } else {
                    objectList.push(object);
                }
            }
        };

        this._members.forEach((member, i) => {
            if (member instanceof WebaniCollection) {
                addObjectsToList(...member.flatObjects);
            } else {
                addObjectsToList(member);
            }
        });

        return objectList;
    }

    /**
     * Sets the main camera of the scene.
     * 
     * @param camera - The camera to set as the main camera.
     */
    setCamera(camera: WebaniPerspectiveCamera) {
        this._mainCamera = camera; 
    }

    /**
     * Adds a light to the scene.
     * 
     * @param light - The light to add to the scene.
     */
    addLight(light: WebaniPointLight) {
        const numLights = this._lights.push(light);
        this._lightPositions = new Float32Array(numLights * 3);
        this._lightColors = new Float32Array(numLights * 3);
        this._lightIntensities = new Float32Array(numLights);

        for (let i = 0; i < numLights; i++) { 
            const light = this._lights[i];
            VectorUtils.setFlat(this._lightPositions, 3, i, light.transform.position);
            VectorUtils.setFlat(this._lightColors, 3, i, light.color);
            VectorUtils.setFlat(this._lightIntensities, 1, i, [light.intensity]);
        }
    }

    /**
     * Adds an object to the scene.
     * 
     * @param object - The `WebaniTransformable` object to add to the scene.
     * @returns The index of the object in the members array, or `undefined` if not added.
     */
    add(object: WebaniTransformable): number | undefined {
        this._members.push(object);
        return this._members.length - 1;
    }

    /**
     * Clears all objects and lights from the scene.
     * 
     * @returns The current `WebaniScene` instance after clearing.
     */
    clear(): WebaniScene { 
        this._members = [];
        return this;
    }

    /**
     * Removes an object from the scene by index.
     * 
     * @param index - The index of the object to remove from the scene.
     * @returns The current `WebaniScene` instance after removal.
     */
    removeIndex(index: number) {
        this._members.splice(index, 1);
        return this;
    }
}