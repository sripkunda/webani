import { WanimCanvas } from "./wanim-canvas.class";

export var _defaultCanvas: WanimCanvas;
export const setDefaultCanvas = (canvas: WanimCanvas) => {
    _defaultCanvas = canvas;
};