import { WebaniMaterial } from "../renderer/lighting/webani-material.class";
import { GLBParserResultAnimationData } from "./glb-parser-result-animation-datatype";
import { GLBParserResultVertexData } from "./glb-parser-vertex-data.type";

export type GLBParserResult = {
    vertexData: GLBParserResultVertexData;
    animationData: GLBParserResultAnimationData;
    material: WebaniMaterial;
};