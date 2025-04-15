#version 300 es
precision highp float;

uniform sampler2D uHDRTexture;

in vec3 texCoords;
out vec4 outColor;

void main() {
    vec2 uv = vec2(0.5 + atan(texCoords.z, texCoords.x) / (2.0 * 3.14159), 0.5 - asin(texCoords.y) / 3.14159);
    outColor = texture(uHDRTexture, uv);
}