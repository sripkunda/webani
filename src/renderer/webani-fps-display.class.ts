import { WebaniCanvas } from "./webani-canvas.class";

export const WebaniFPSDisplay = class {
    
    element: HTMLElement;
    canvas: WebaniCanvas;
    
    constructor(element: HTMLElement, canvas: WebaniCanvas) {
        this.element = element;
        this.canvas = canvas;
        canvas.onUpdate((dt: number) => {
            const fps = 1000 / dt;
            this.element.textContent = fps.toFixed(1);
        });
    }
};