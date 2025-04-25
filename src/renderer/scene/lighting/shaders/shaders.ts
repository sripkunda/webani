import objectVert from './pbr/object.vert';
import objectFrag from './pbr/object.frag';
import skyboxVert from './skybox/skybox.vert';
import skyboxFrag from './skybox/skybox.frag';
import irradianceComputeVert from './pbr/irradiance-compute.vert';
import irradianceComputeFrag from './pbr/irradiance-compute.frag';
import prefilterComputeVert from './pbr/prefilter-compute.vert';
import prefilterComputeFrag from './pbr/prefilter-compute.frag';
import brdfLUTComputeVert from './pbr/brdf-lut-compute.vert';
import brdfLUTComputeFrag from './pbr/brdf-lut-compute.frag';
import { ShaderSet } from '../../../../types/shader-set.type';

export const objectShaderSet: ShaderSet = {
    fragment: objectFrag,
    vertex: objectVert,
};

export const skyboxShaderSet: ShaderSet = {
    fragment: skyboxFrag,
    vertex: skyboxVert,
};

export const irradianceComputeShaderSet: ShaderSet = {
    fragment: irradianceComputeFrag,
    vertex: irradianceComputeVert,
};

export const prefilterComputeShaderSet: ShaderSet = {
    fragment: prefilterComputeFrag,
    vertex: prefilterComputeVert,
};

export const brdfLUTComputeShaderSet: ShaderSet = {
    fragment: brdfLUTComputeFrag,
    vertex: brdfLUTComputeVert
}