import { RenderedCollection } from "../animations/rendered-collection.class";
import { WanimAnimationBase } from "../animations/wanim-animation-base.class";
import { WanimObjectAnimation } from "../animations/wanim-object-animation.class";
import { _defaultCanvas, setDefaultCanvas } from "../canvas/default-canvas";
import { WanimCanvas } from "../canvas/wanim-canvas.class";
import { WanimObject } from "../objects/wanim-object.class";
import { Vector } from "../util/vector.type";
import { Value } from "../variables/value.type";
import { WanimVariable } from "../variables/wanim-variable.class";
import { Colors } from "./colors";

export const LoadCanvas = async function (...canvases: HTMLCanvasElement[]) {
    let wanimCanvases = await new Promise<WanimCanvas[]>(resolve => {
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
    const animation = new WanimObjectAnimation(new WanimObject([], []), new WanimObject([], []), duration);
    _defaultCanvas?.play(animation);
};

export const Play = (...animations: any[]): void => {
    _defaultCanvas?.play(...animations);
};

export const Variable = (value: any): WanimVariable<any> => {
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

export const Group = (object: any) => {
    return RenderedCollection.Group(object);
}