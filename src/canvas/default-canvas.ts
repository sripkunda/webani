import { LorentzCanvas } from "./lorentz-canvas.class";

export let _defaultCanvas: LorentzCanvas;
export const setDefaultCanvas = (canvas: LorentzCanvas) => {
    _defaultCanvas = canvas;
};