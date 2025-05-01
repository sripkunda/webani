import { GLBParserResultAnimation } from "./glb-parser-result-animation.type";
import { GLBParserNode } from "./glb-parser-node.type";
import { GLBParserResultSkinData } from "./glb-parser-result-skin-data.type";

export type GLBParserResultAnimationData = {
    skin: GLBParserResultSkinData;
    nodes: GLBParserNode[];
    animations: GLBParserResultAnimation[];
};