import { _defaultCanvas } from "../canvas/default-canvas";

export const UP = (lorentzCanvas = _defaultCanvas) => [0, lorentzCanvas.canvas.height / 10, 0];
export const DOWN = (lorentzCanvas = _defaultCanvas) => [0, -lorentzCanvas.canvas.height / 10, 0];
export const RIGHT = (lorentzCanvas = _defaultCanvas) => [lorentzCanvas.canvas.width / 10, 0, 0];
export const LEFT = (lorentzCanvas = _defaultCanvas) => [-lorentzCanvas.canvas.width / 10, 0, 0];