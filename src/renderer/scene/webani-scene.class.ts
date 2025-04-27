import { VectorUtils } from "../util/vector.utils";
import { WebaniPerspectiveCamera } from "./camera/webani-perspective-camera.class";
import { WebaniCollection } from "./collections/webani-collection.class";
import { WebaniPointLight } from "./lighting/webani-point-light.class";
import { WebaniTransformable } from "./webani-transformable.class";

export class WebaniScene {

    _members: WebaniTransformable[] = [];
    _lights: WebaniPointLight[] = [];
    _mainCamera: WebaniPerspectiveCamera;
    _lightPositions: Float32Array;
    _lightIntensities: Float32Array;
    _lightColors: Float32Array;

    constructor(...members: WebaniTransformable[]) {
        this._members = members;
        this._mainCamera = new WebaniPerspectiveCamera();
        this.addLight(new WebaniPointLight());
    }

    get camera() {
        return this._mainCamera;
    }

    get numLights(): number {
        return this._lights.length;
    }

    get lightPositions(): Float32Array { 
        return this._lightPositions;
    }

    get lightColors(): Float32Array {
        return this._lightColors;
    }

    get lightIntensities(): Float32Array { 
        return this._lightIntensities;
    }

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
        }
        this._members.forEach((member, i) => {
            if (member instanceof WebaniCollection) {
                addObjectsToList(...member.flatObjects)
            } else {
                addObjectsToList(member);
            }
        });
        return objectList;
    }

    setCamera(camera: WebaniPerspectiveCamera) {
        this._mainCamera = camera; 
    }

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

    add(object: WebaniTransformable): number | undefined {
        this._members.push(object);
        return this._members.length - 1;
    }

    clear(): WebaniScene { 
        this._members = [];
        return this;
    }

    removeIndex(index: number) {
        this._members.splice(index, 1);
        return this;
    }
}