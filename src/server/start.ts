import { FPSDisplay } from "../rendering/fps-display.class";
import { LoadCanvas } from "../api/animate";

new FPSDisplay(document.querySelector("#fps"));
const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
await LoadCanvas(canvas);