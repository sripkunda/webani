import { WebaniCanvas } from "./webani-canvas.class";

export let _defaultCanvas: WebaniCanvas;
export const setDefaultCanvas = (canvas: WebaniCanvas) => {
    _defaultCanvas = canvas;
};