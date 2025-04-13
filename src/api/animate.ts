import { Playable } from "../animations/playable.type";
import { LorentzPolygonAnimation } from "../animations/lorentz-polygon-animation.class";
import { _defaultCanvas, setDefaultCanvas } from "../canvas/default-canvas";
import { LorentzCanvas } from "../canvas/lorentz-canvas.class";
import { LorentzPolygon } from "../polygon/lorentz-polygon.class";
import { LorentzVariable } from "../variables/lorentz-variable.class";

export const LoadCanvas = async function (...canvases: HTMLCanvasElement[]) {
    const lorentzCanvases = await new Promise<LorentzCanvas[]>(resolve => {
        const loadedLorentzCanvases = canvases.map(canvas => new LorentzCanvas(canvas));
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => resolve(loadedLorentzCanvases));
        } else {
            resolve(loadedLorentzCanvases);
        }
    });
    if (lorentzCanvases.length > 0) {
        setDefaultCanvas(lorentzCanvases[0]);
        return lorentzCanvases[0];
    }
}

export const Wait = (duration: number): void => {
    const animation = new LorentzPolygonAnimation(new LorentzPolygon([], []), new LorentzPolygon([], []), duration);
    _defaultCanvas?.play(animation);
};

export const Play = (...animations: Playable[]): void => {
    _defaultCanvas?.play(...animations);
};

export const Variable = (value: unknown): LorentzVariable<unknown> => {
    return new LorentzVariable(value);
}

export const BottomLeft = (lorentzCanvas: LorentzCanvas = _defaultCanvas): [number, number] => {
    return [-lorentzCanvas.canvas.width, -lorentzCanvas.canvas.height];
};

export const BottomRight = (lorentzCanvas: LorentzCanvas = _defaultCanvas): [number, number] => {
    return [lorentzCanvas.canvas.width, -lorentzCanvas.canvas.height];
};

export const TopLeft = (lorentzCanvas: LorentzCanvas = _defaultCanvas): [number, number] => {
    return [-lorentzCanvas.canvas.width, lorentzCanvas.canvas.height];
};

export const TopRight = (lorentzCanvas: LorentzCanvas = _defaultCanvas): [number, number] => {
    return [lorentzCanvas.canvas.width, lorentzCanvas.canvas.height];
};

export const Group = (object: object) => {
    
}