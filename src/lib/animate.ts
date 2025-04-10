import { Playable } from "../animations/playable.type";
import { RenderedCollection } from "../animations/rendered-collection.class";
import { WanimPolygonAnimation } from "../animations/wanim-polygon-animation.class";
import { _defaultCanvas, setDefaultCanvas } from "../canvas/default-canvas";
import { WanimCanvas } from "../canvas/wanim-canvas.class";
import { WanimPolygonObject } from "../polygon/wanim-polygon.class";
import { WanimVariable } from "../variables/wanim-variable.class";

export const LoadCanvas = async function (...canvases: HTMLCanvasElement[]) {
    const wanimCanvases = await new Promise<WanimCanvas[]>(resolve => {
        const loadedWanimCanvases = canvases.map(canvas => new WanimCanvas(canvas));
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => resolve(loadedWanimCanvases));
        } else {
            resolve(loadedWanimCanvases);
        }
    });
    if (wanimCanvases.length > 0) {
        setDefaultCanvas(wanimCanvases[0]);
        return wanimCanvases[0];
    }
}

export const Wait = (duration: number): void => {
    const animation = new WanimPolygonAnimation(new WanimPolygonObject([], []), new WanimPolygonObject([], []), duration);
    _defaultCanvas?.play(animation);
};

export const Play = (...animations: Playable[]): void => {
    _defaultCanvas?.play(...animations);
};

export const Variable = (value: unknown): WanimVariable<unknown> => {
    return new WanimVariable(value);
}

export const BottomLeft = (wanimCanvas: WanimCanvas = _defaultCanvas): [number, number] => {
    return [-wanimCanvas.canvas.width, -wanimCanvas.canvas.height];
};

export const BottomRight = (wanimCanvas: WanimCanvas = _defaultCanvas): [number, number] => {
    return [wanimCanvas.canvas.width, -wanimCanvas.canvas.height];
};

export const TopLeft = (wanimCanvas: WanimCanvas = _defaultCanvas): [number, number] => {
    return [-wanimCanvas.canvas.width, wanimCanvas.canvas.height];
};

export const TopRight = (wanimCanvas: WanimCanvas = _defaultCanvas): [number, number] => {
    return [wanimCanvas.canvas.width, wanimCanvas.canvas.height];
};

export const Group = (object: object) => {
    return RenderedCollection.Group(object);
}