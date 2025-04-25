import { Bird } from "./src/components/bird.component";
import { ExampleSkybox } from "./src/examples/examples";
import { WebaniCanvas } from "./src/renderer/webani-canvas.class";
import { Play } from "./src/webani";

WebaniCanvas.defaultCanvas.setSkybox(ExampleSkybox);
const scene = Bird([0, 0, 0], 50);
scene.Rotate([0, 720, 0], 20000);
Play(scene);