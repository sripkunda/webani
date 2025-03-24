import { Play, ScreenCenter } from "../src/animations";
import { FPSDisplay, loadCanvas } from "../src/canvas";
import { Colors } from "../src/constants";
import { Square, Text } from "../src/objects";
import { WanimVariable } from "../src/variables";

new FPSDisplay(document.querySelector("#fps"));

let canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const wcanvas = await loadCanvas(canvas);
const display = new WanimVariable({
    text: "\"The contribution of mathematics, and of people, is not computation but intelligence.\" - Gilbert Strang",
    color: Colors.WHITE
});
const animation = Text(display.text, [500, 500], 50, display.color).PositionAt(ScreenCenter());
animation.FadeIn().Rotate(360);
Play(animation);