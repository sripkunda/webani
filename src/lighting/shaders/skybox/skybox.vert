#version 300 es
precision highp float;

in vec4 position;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

out vec3 texCoords;

void main() {
    mat4 viewRot = mat4(mat3(uViewMatrix)); 
    vec4 transformedPosition = uProjectionMatrix * viewRot * position;
    texCoords = position.xyz;
    gl_Position = transformedPosition;
}