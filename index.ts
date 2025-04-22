import { Bird } from "./src/components/bird.component";
import { defaultSkybox } from "./src/examples/examples";
import { Colors } from "./src/renderer/lighting/colors";
import { WebaniCanvas } from "./src/renderer/webani-canvas.class";
import { Play } from "./src/webani";

WebaniCanvas.defaultCanvas.setSkybox(defaultSkybox);
const scene = Bird([0, 0, 0], 50);
scene.Rotate([0, 720, 0], 20000);
Play(scene);