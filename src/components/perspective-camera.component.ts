import { Component } from "../renderer/scene/component.class";
import { WebaniPerspectiveCamera, WebaniPerspectiveCameraOptions } from "../renderer/scene/camera/webani-perspective-camera.class";

/**
 * A component that creates a perspective camera object.
 * 
 * This uses `WebaniPerspectiveCamera` to instantiate a camera with the provided options.
 */
export class PerspectiveCameraComponent extends Component {
    /**
     * Constructs a new `WebaniPerspectiveCamera` with the provided options.
     *
     * @param options - Configuration options for the perspective camera.
     * @returns A new `WebaniPerspectiveCamera` instance.
     */
    objectConstructor(options: WebaniPerspectiveCameraOptions): WebaniPerspectiveCamera {
        return new WebaniPerspectiveCamera(options);
    }
}

/**
 * A reusable generator instance for creating perspective camera components.
 */
export const PerspectiveCamera = PerspectiveCameraComponent.GetGenerator();