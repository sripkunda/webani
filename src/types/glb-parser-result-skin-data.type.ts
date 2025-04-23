import { Matrix4 } from "./matrix4.type";

export type GLBParserResultSkinData = {
    joints?: number[];
    extractInverseBindMatrices?: Matrix4[];
};