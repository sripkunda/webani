import { _defaultCanvas } from "../canvas/default-canvas";

export const UP = (webaniCanvas = _defaultCanvas) => [0, webaniCanvas.canvas.height / 10, 0];
export const DOWN = (webaniCanvas = _defaultCanvas) => [0, -webaniCanvas.canvas.height / 10, 0];
export const RIGHT = (webaniCanvas = _defaultCanvas) => [webaniCanvas.canvas.width / 10, 0, 0];
export const LEFT = (webaniCanvas = _defaultCanvas) => [-webaniCanvas.canvas.width / 10, 0, 0];