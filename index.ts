import { Play } from "./src/webani";
import { Text } from "./src/components/text.component";
import { Colors } from "./src/renderer/lighting/colors";

const cube = Text("hello", [0, 0], 200, Colors.WHITE);
cube.Rotate([0, 45, 0]);
cube.TransformInto(Text("world", [0, 0], 200, Colors.WHITE));
Play(cube);
