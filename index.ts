import { Group, Play } from "./src/api/animate";
import { WebaniCanvas } from "./src/rendering/webani-canvas.class";
import { Cube } from "./src/api/components/cube.component";
import { Colors } from "./src/lighting/colors";
import { Sphere } from "./src/api/components/sphere.component";
import { Text } from "./src/api/components/text.component";
import { Square, SquareComponent } from "./src/api/components/square.component";
import { WebaniMaterial } from "./src/lighting/webani-material.class";
import { defaultSkybox } from "./src/api/examples";
import { Bird } from "./src/api/components/bird.component";
import { Cone } from "./src/api/components/cone.component";
import { BirdMesh } from "./src/api/components/models/models";

WebaniCanvas.defaultCanvas.setSkybox(defaultSkybox);
const cone = Bird([0, 0, 0], [50, 50, 50], Colors.BLACK);
cone.Rotate([720, 720, 720], 5000);
Play(cone);