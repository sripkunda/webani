import { Playable } from "../types/playable.type";
import { WebaniPolygonAnimation } from "../animations/webani-polygon-animation.class";
import { _defaultCanvas, setDefaultCanvas } from "../canvas/default-canvas";
import { WebaniCanvas } from "../canvas/webani-canvas.class";
import { WebaniPolygon } from "../polygon/webani-polygon.class";
import { WebaniVariable } from "../variables/webani-variable.class";

export const LoadCanvas = async function (...canvases: HTMLCanvasElement[]) {
    const webaniCanvases = await new Promise<WebaniCanvas[]>(resolve => {
        const loadedWebaniCanvases = canvases.map(canvas => new WebaniCanvas(canvas));
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => resolve(loadedWebaniCanvases));
        } else {
            resolve(loadedWebaniCanvases);
        }
    });
    if (webaniCanvases.length > 0) {
        setDefaultCanvas(webaniCanvases[0]);
        return webaniCanvases[0];
    }
}

export const Wait = (duration: number): void => {
    const animation = new WebaniPolygonAnimation(new WebaniPolygon([], []), new WebaniPolygon([], []), duration);
    _defaultCanvas?.play(animation);
};

export const Play = (...animations: Playable[]): void => {
    _defaultCanvas?.play(...animations);
};

export const Variable = (value: unknown): WebaniVariable<unknown> => {
    return new WebaniVariable(value);
}

export const BottomLeft = (webaniCanvas: WebaniCanvas = _defaultCanvas): [number, number] => {
    return [-webaniCanvas.canvas.width, -webaniCanvas.canvas.height];
};

export const BottomRight = (webaniCanvas: WebaniCanvas = _defaultCanvas): [number, number] => {
    return [webaniCanvas.canvas.width, -webaniCanvas.canvas.height];
};

export const TopLeft = (webaniCanvas: WebaniCanvas = _defaultCanvas): [number, number] => {
    return [-webaniCanvas.canvas.width, webaniCanvas.canvas.height];
};

export const TopRight = (webaniCanvas: WebaniCanvas = _defaultCanvas): [number, number] => {
    return [webaniCanvas.canvas.width, webaniCanvas.canvas.height];
};

export const Group = (object: object) => {
    
}