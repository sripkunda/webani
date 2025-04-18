import { Group, Play } from "./src/api/animate";
import { defaultSkybox } from "./src/util/skyboxes.util";
import { WebaniCanvas } from "./src/rendering/webani-canvas.class";
import { Text } from "./src/api/components/text.component";
import { Square } from "./src/api/components/square.component";
import { Cube } from "./src/api/components/cube.component";

WebaniCanvas.defaultCanvas.setSkybox(defaultSkybox);

const lookAround = (e) => {
    const sensitivity = 0.1;
    const dx = e.movementX;
    const dy = e.movementY;

    WebaniCanvas.defaultCanvas.camera.transform.rotation[1] -= dx * sensitivity;
    WebaniCanvas.defaultCanvas.camera.transform.rotation[0] -= dy * sensitivity;
    WebaniCanvas.defaultCanvas.camera.transform.rotation[0] = Math.max(-90, Math.min(90, WebaniCanvas.defaultCanvas.camera.transform.rotation[0]));
    WebaniCanvas.defaultCanvas.redraw();
};

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

// --- Movement based on WASD ---
const moveCamera = (direction: string) => {
    const camera = WebaniCanvas.defaultCanvas.camera.transform;
    const yaw = camera.rotation[1] * Math.PI / 180; // convert to radians
    const speed = 10;

    // Calculate direction vectors
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    const rightX = Math.sin(yaw + Math.PI / 2);
    const rightZ = Math.cos(yaw + Math.PI / 2);

    switch (direction) {
        case "w":
            camera.position[0] += forwardX * speed;
            camera.position[2] += forwardZ * speed;
            break;
        case "s":
            camera.position[0] -= forwardX * speed;
            camera.position[2] -= forwardZ * speed;
            break;
        case "a":
            camera.position[0] += rightX * speed;
            camera.position[2] += rightZ * speed;
            break;
        case "d":
            camera.position[0] -= rightX * speed;
            camera.position[2] -= rightZ * speed;
            break;
    }

    WebaniCanvas.defaultCanvas.redraw();
};

document.addEventListener("keydown", (e) => {
    const keys = ["w", "a", "s", "d"];
    if (keys.includes(e.key.toLowerCase())) {
        moveCamera(e.key.toLowerCase());
    }
});

const cube = Cube([0, 0, 0], 100);
Play(cube);