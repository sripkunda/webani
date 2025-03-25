import { Play, ScreenCenter } from "../src/animations";
import { FPSDisplay, loadCanvas } from "../src/canvas";
import { Colors } from "../src/constants";
import { Circle, Square, Text } from "../src/objects";
import { WanimVariable } from "../src/variables";

new FPSDisplay(document.querySelector("#fps"));
let canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const wcanvas = await loadCanvas(canvas);

// Start animating...
const animation = Text("Hello", ScreenCenter(), 200, Colors.WHITE);
animation.ZoomIn();
Play(animation);