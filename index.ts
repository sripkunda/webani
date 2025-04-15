import { Group, Play } from "./src/api/animate";
import { defaultSkybox } from "./src/util/skyboxes.util";
import { WebaniCanvas } from "./src/canvas/webani-canvas.class";

WebaniCanvas.defaultCanvas.setSkybox(defaultSkybox);

const lookAround = (e) => {
    const sensitivity = 0.1;
    const dx = e.movementX;
    const dy = e.movementY;

    WebaniCanvas.defaultCanvas.camera.transform.rotation[1] -= dx * sensitivity;
    WebaniCanvas.defaultCanvas.camera.transform.rotation[0] -= dy * sensitivity;
    WebaniCanvas.defaultCanvas.camera.transform.rotation[0] = Math.max(-90, Math.min(90, WebaniCanvas.defaultCanvas.camera.transform.rotation[0]));
    WebaniCanvas.defaultCanvas.redraw();
}


WebaniCanvas.defaultCanvas.canvas.addEventListener("click", () => {
    if (document.pointerLockElement === WebaniCanvas.defaultCanvas.canvas) {
        return;
    }
    WebaniCanvas.defaultCanvas.canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === WebaniCanvas.defaultCanvas.canvas) {
        WebaniCanvas.defaultCanvas.canvas.style.cursor = "none";
        document.addEventListener("mousemove", lookAround);
    } else {
        WebaniCanvas.defaultCanvas.canvas.style.cursor = "default";
        document.removeEventListener("mousemove", lookAround);
    }
});

