import { _defaultCanvas } from "./src/canvas/default-canvas";
import { Play } from "./src/api/animate";
import { Text } from "./src/api/components/text.component";

const text = Text("hello", [0, 0]).Rotate([0, 360, 0], 10000);
Play(text);