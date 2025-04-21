import { WebaniMesh } from "../../../objects/webani-mesh.class";
import spherePath from "./sphere.glb";
import birdPath from "./bird.glb"; 
import conePath from "./cone.glb"; 

export const SphereMesh = await WebaniMesh.import(spherePath);
export const BirdMesh = await WebaniMesh.import(birdPath);
export const ConeMesh = await WebaniMesh.import(conePath);