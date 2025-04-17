export const FPSDisplay = class {
    
    element: HTMLElement;
    
    constructor(element: HTMLElement) {
        this.element = element;
        this.init();
    }

    init() {
        let prevTime = 0;
        const render = (currentTime: number) => {
            currentTime /= 1000;
            const fps = 1 / (currentTime - prevTime);
            prevTime = currentTime;
            this.element.textContent = fps.toFixed(1);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
};