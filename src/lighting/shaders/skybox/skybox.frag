#version 300 es
precision highp float;

uniform samplerCube uHDRTexture;

in vec3 texCoords;
out vec4 outColor;

void main() {
    outColor = texture(uHDRTexture, texCoords);
}