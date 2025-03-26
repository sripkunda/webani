import { RenderedCollection } from "../animations/rendered-collection.class";
import { WanimAnimationBase } from "../animations/wanim-animation-base.class";
import { WanimObjectAnimation } from "../animations/wanim-object-animation.class";
import { _defaultCanvas, setDefaultCanvas } from "../canvas/default-canvas";
import { WanimCanvas } from "../canvas/wanim-canvas.class";
import { CreateRenderedCollection, ObjectConstructors } from "../objects/object-constructors";
import { Vector } from "../util/vector.type";
import { Value } from "../variables/variable.type";
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

export const Wait = (duration: number): WanimAnimationBase => {
    const animation = new WanimObjectAnimation(null, null, duration);
    _defaultCanvas?.play(animation);
    return animation;
};

export const Play = (...animations: any[]): void => {
    _defaultCanvas?.play(...animations);
};

export const Variable = (value: any): WanimVariable<any> => {
    return new WanimVariable(value);
}

export const ScreenCenter = (wanimCanvas: WanimCanvas = _defaultCanvas): [number, number] => {
    return [wanimCanvas.canvas.width / 2, wanimCanvas.canvas.height / 2];
};

export const Group = (object: any) => {
    return RenderedCollection.Group(object);
}

export const Triangle = (points: Value<Vector[]>, color: Value<Vector> = Colors.WHITE, opacity: Value<number> = Variable(1)) => {
    return CreateRenderedCollection(ObjectConstructors.Triangle, points, color, opacity);
}

export const Rectangle = (position: Value<Vector>, length_x: Value<number>, length_y: Value<number>, color: Value<Vector> = Colors.WHITE, opacity: Value<number> = Variable(1)) => {
    return CreateRenderedCollection(ObjectConstructors.Rectangle, position, length_x, length_y, color, opacity);
}

export const Square = (position: Value<Vector>, length: Value<number>, color: Value<Vector> = Colors.WHITE, opacity: Value<number> = Variable(1)) => {
    return Rectangle(position, length, length, color, opacity);
}

export const Line = (position: Value<Vector>, length: Value<number>, angle: Value<number> = Variable(0), thickness: Value<number> = Variable(2), color: Value<Vector> = Colors.WHITE, opacity: Value<number> = Variable(1)) => {
    return CreateRenderedCollection(ObjectConstructors.Line, position, length, angle, thickness, color, opacity);
}

export const Circle = (center: Value<Vector>, radius: Value<number>, color: Value<Vector> = Colors.WHITE, opacity: Value<number> = Variable(1)) => {
    return CreateRenderedCollection(ObjectConstructors.Circle, center, radius, color, opacity);
}

export const ConnectingLine = (start: Value<Vector>, end: Value<Vector>, thickness: Value<number> = Variable(5), color: Value<Vector> = Colors.WHITE, opacity: Value<number> = Variable(1)) => {
    start = Variable(start);
    end = Variable(end)
    let angle = Variable(() => Math.atan((start.value[1] - end.value[1]) / (start.value[0] - end.value[0])) * 180 / Math.PI);
    let length = Variable(() => Math.sqrt(Math.pow(start.value[1] - end.value[1], 2) + Math.pow(start.value[0] - end.value[0], 2)))
    return Line(start, length, angle, thickness, color, opacity);
}

export const Text = (string: Value<string>, position: Value<Vector>, fontSize: Value<number> = Variable(72), color: Value<Vector> = Colors.WHITE, opacity: Value<number> = Variable(1)) => {
    return CreateRenderedCollection(ObjectConstructors.Text, string, position, fontSize, color, opacity);
}