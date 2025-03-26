import { _defaultCanvas } from "../canvas/default-canvas";

export const UP = (wanimCanvas = _defaultCanvas) => [0, wanimCanvas.canvas.height / 10, 0];
export const DOWN = (wanimCanvas = _defaultCanvas) => [0, -wanimCanvas.canvas.height / 10, 0];
export const RIGHT = (wanimCanvas = _defaultCanvas) => [wanimCanvas.canvas.width / 10, 0, 0];
export const LEFT = (wanimCanvas = _defaultCanvas) => [-wanimCanvas.canvas.width / 10, 0, 0];