import { GLBParserAccessor } from "./glb-parser-accessor.type";
import { GLBParserBufferView } from "./glb-parser-buffer-view.type";
import { GLBParserImage } from "./glb-parser-image.type";
import { GLBParserMesh } from "./glb-parser-mesh.type";
import { GLBParserNode } from "./glb-parser-node.type";
import { GLBParserTexture } from "./glb-parser-texture.type";

export type GLBParserJSON = {
    nodes: GLBParserNode[];
    meshes: GLBParserMesh[];
    accessors: GLBParserAccessor[];
    bufferViews: GLBParserBufferView[];
    skins?: GLBParserSkin[];
    materials?: GLBParserMaterial[];
    textures?: GLBParserTexture[];
    images?: GLBParserImage[];
    animations?: [];
};