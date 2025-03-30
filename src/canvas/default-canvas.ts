import { WanimCanvas } from "./wanim-canvas.class";

export let _defaultCanvas: WanimCanvas;
export const setDefaultCanvas = (canvas: WanimCanvas) => {
    _defaultCanvas = canvas;
};