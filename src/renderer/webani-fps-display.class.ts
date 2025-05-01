import { WebaniCanvas } from "./webani-canvas.class";

/**
 * A class that displays the FPS (Frames Per Second) of a given canvas element.
 * It listens for update events from the provided WebaniCanvas instance 
 * and calculates the FPS based on the delta time (`dt`) between frames.
 */
export class WebaniFPSDisplay {
    
    /** The HTML element where the FPS will be displayed. */
    element: HTMLElement;

    /** The WebaniCanvas instance that provides frame update events. */
    canvas: WebaniCanvas;

    /**
     * Creates an instance of the WebaniFPSDisplay.
     * 
     * @param element - The HTML element where the FPS will be shown.
     * @param canvas - The WebaniCanvas instance to listen for update events.
     */
    constructor(element: HTMLElement, canvas: WebaniCanvas) {
        this.element = element;
        this.canvas = canvas;

        // Set up an event listener to update the FPS display every time the canvas updates
        canvas.onUpdate((dt: number) => {
            const fps = 1000 / dt;  // Calculate FPS from delta time
            this.element.textContent = fps.toFixed(1);  // Display the FPS in the element
        });
    }
};
