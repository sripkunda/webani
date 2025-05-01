import { GLBParserResultMeshData } from "./glb-parser-result-mesh-data.type";
import { GLBParserResultAnimationData } from "./glb-parser-result-animation-datatype";
import { GLBParserResultVertexData } from "./glb-parser-vertex-data.type";

export type GLBParserPrimitiveParseResult = {
    meshes: GLBParserResultMeshData[];
    animationData: GLBParserResultAnimationData;
};