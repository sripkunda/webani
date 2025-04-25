import { Playable } from "./renderer/types/playable.type";
import { WebaniCanvas, WebaniRendererOptions } from "./renderer/webani-canvas.class";
import { WebaniVariable } from "./renderer/variables/webani-variable.class";
import { RenderedGroupNode } from "./renderer/animation/rendered-group-node.class";

export const LoadCanvas = async function (options: WebaniRendererOptions) {
    return await new Promise<WebaniCanvas>(resolve => {
        const loadedCanvas = new WebaniCanvas(options);
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => resolve(loadedCanvas));
        } else {
            resolve(loadedCanvas);
        }
    });
}

export const Play = (...animations: Playable[]): void => {
    WebaniCanvas.defaultCanvas?.play(...animations);
};

export const Variable = (value: unknown): WebaniVariable<unknown> => {
    return new WebaniVariable(value);
}

export const BottomLeft = (webaniCanvas: WebaniCanvas = WebaniCanvas.defaultCanvas): [number, number] => {
    return [-webaniCanvas.htmlCanvas.width, -webaniCanvas.htmlCanvas.height];
};

export const BottomRight = (webaniCanvas: WebaniCanvas = WebaniCanvas.defaultCanvas): [number, number] => {
    return [webaniCanvas.htmlCanvas.width, -webaniCanvas.htmlCanvas.height];
};

export const TopLeft = (webaniCanvas: WebaniCanvas = WebaniCanvas.defaultCanvas): [number, number] => {
    return [-webaniCanvas.htmlCanvas.width, webaniCanvas.htmlCanvas.height];
};

export const TopRight = (webaniCanvas: WebaniCanvas = WebaniCanvas.defaultCanvas): [number, number] => {
    return [webaniCanvas.htmlCanvas.width, webaniCanvas.htmlCanvas.height];
};

export const Group = (object: object) => { 
    return RenderedGroupNode.CreateGroup(object);
}

export const UP = (webaniCanvas = WebaniCanvas.defaultCanvas) => [0, webaniCanvas.htmlCanvas.height / 10, 0];
export const DOWN = (webaniCanvas = WebaniCanvas.defaultCanvas) => [0, -webaniCanvas.htmlCanvas.height / 10, 0];
export const RIGHT = (webaniCanvas = WebaniCanvas.defaultCanvas) => [webaniCanvas.htmlCanvas.width / 10, 0, 0];
export const LEFT = (webaniCanvas = WebaniCanvas.defaultCanvas) => [-webaniCanvas.htmlCanvas.width / 10, 0, 0];