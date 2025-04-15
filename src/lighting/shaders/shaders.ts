import objectVert from './pbr/object.vert';
import objectFrag from './pbr/object.frag';
import skyboxVert from './skybox/skybox.vert';
import skyboxFrag from './skybox/skybox.frag';
import { ShaderSet } from '../../types/shader-set.type';

export const objectShaderSet: ShaderSet = {
    fragment: objectFrag,
    vertex: objectVert,
};
export const skyboxShaderSet: ShaderSet = {
    fragment: skyboxFrag,
    vertex: skyboxVert,
};