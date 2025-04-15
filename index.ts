import { Group, Play } from "./src/api/animate";
import { Line } from "./src/api/components/line.component";
import { Text } from "./src/api/components/text.component";

const graph = Text("hello world", [0, 0]).Rotate([0, 360, 0]);
Play(graph);