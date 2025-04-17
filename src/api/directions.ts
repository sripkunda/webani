import { WebaniCanvas } from "../rendering/webani-canvas.class";

export const UP = (webaniCanvas = WebaniCanvas.defaultCanvas) => [0, webaniCanvas.canvas.height / 10, 0];
export const DOWN = (webaniCanvas = WebaniCanvas.defaultCanvas) => [0, -webaniCanvas.canvas.height / 10, 0];
export const RIGHT = (webaniCanvas = WebaniCanvas.defaultCanvas) => [webaniCanvas.canvas.width / 10, 0, 0];
export const LEFT = (webaniCanvas = WebaniCanvas.defaultCanvas) => [-webaniCanvas.canvas.width / 10, 0, 0];