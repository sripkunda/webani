#version 300 es
precision highp float;

in vec4 position;
out vec3 texCoords;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

void main() {
    texCoords = position.xyz; // Pass the cube vertex position as the texture coordinates
    gl_Position = projectionMatrix * viewMatrix * position;
}