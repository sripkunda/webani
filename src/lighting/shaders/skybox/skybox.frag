#version 300 es
precision mediump float;

uniform samplerCube uHDRTexture;

in vec3 texCoords;
out vec4 outColor;

void main() {
    vec3 color = texture(uHDRTexture, texCoords).rgb;
    color = pow(color, vec3(1.0/2.2)); 
    outColor = vec4(color, 1.0);
}