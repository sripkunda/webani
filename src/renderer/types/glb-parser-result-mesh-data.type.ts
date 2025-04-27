import { WebaniMaterial } from "../scene/lighting/webani-material.class"
import { GLBParserResultVertexData } from "./glb-parser-vertex-data.type";

export type GLBParserResultMeshData = { 
    material: WebaniMaterial;
    vertexData: GLBParserResultVertexData
}