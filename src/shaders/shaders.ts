import objectVert from './object.vert';
import objectFrag from './object.frag';
import skyboxVert from './skybox.vert';
import skyboxFrag from './skybox.frag';
import { ShaderSet } from '../types/shader-set.type';

export const objectShaderSet: ShaderSet = {
    fragment: objectFrag,
    vertex: objectVert,
};
export const skyboxShaderSet: ShaderSet = {
    fragment: skyboxFrag,
    vertex: skyboxVert,
};