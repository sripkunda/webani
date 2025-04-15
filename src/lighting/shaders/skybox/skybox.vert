#version 300 es
precision highp float;

in vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec3 texCoords;

void main() {
    mat4 viewRot = mat4(mat3(viewMatrix)); 
    vec4 transformedPosition = projectionMatrix * viewRot * position;
    texCoords = position.xyz;
    gl_Position = transformedPosition;
}