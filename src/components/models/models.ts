import spherePath from "./sphere.glb";
import conePath from "./cone.glb"; 
import { WebaniMesh } from "../../renderer/scene/meshes/webani-mesh.class";

export const SphereMesh = await WebaniMesh.import(spherePath);
export const ConeMesh = await WebaniMesh.import(conePath);