import { Vector2 } from "./vector2.type";
import { Vector3 } from "./vector3.type";

export type GLBParserResultVertexData = {
    triangles: Vector3[];
    normals: Vector3[];
    uvs: Vector2[];
    joints: number[];
    weights: number[];
};