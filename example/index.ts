import { FPSDisplay } from '../src/canvas/fps-display.class'
import { Text } from '../src/components/text.component';
import { LoadCanvas, Play, Variable } from '../src/lib/animate';
import { Colors } from '../src/lib/colors';
import { Vector } from '../src/util/vector.type';

new FPSDisplay(document.querySelector("#fps"));
let canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
await LoadCanvas(canvas);

const variable = Variable("test");
const animation = Text(variable, [500, 500], 200).FadeIn();
variable.value = "test!";
Play(animation);