import { Matrix4 } from "./matrix4.type";

export type GLBParserResultSkinData = {
    joints?: number[];
    inverseBindMatrices?: Matrix4[];
};