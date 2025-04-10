import { _defaultCanvas } from "./src/canvas/default-canvas";
import { Play } from "./src/lib/animate";
import { Square } from "./src/lib/components/square.component";

const text = Square([0, 0], 0.5);
Play(text);