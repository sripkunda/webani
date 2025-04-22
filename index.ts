import { Play } from "./src/webani";
import { Colors } from "./src/renderer/lighting/colors";
import { Square } from "./src/components/square.component";
import { Circle } from "./src/components/circle.component";

const cube = Square([0, 0], 200, Colors.WHITE);
cube.Rotate([0, 45, 0]);
cube.TransformInto(Circle([0, 0], 200, Colors.WHITE));
cube.FadeOut();
Play(cube);