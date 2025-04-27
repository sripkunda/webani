import { Component } from "../renderer/scene/component.class";
import { WebaniPerspectiveCamera, WebaniPerspectiveCameraOptions } from "../renderer/scene/camera/webani-perspective-camera.class";

export class PerspectiveCameraComponent extends Component {
    objectConstructor(options: WebaniPerspectiveCameraOptions): WebaniPerspectiveCamera {
        return new WebaniPerspectiveCamera(options);
    }
}

export const PerspectiveCamera = PerspectiveCameraComponent.GetGenerator();
