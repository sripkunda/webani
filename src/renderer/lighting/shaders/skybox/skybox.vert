#version 300 es
precision mediump float;

in vec4 position;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

out vec3 texCoords;

void main() {
    mat4 viewRot = mat4(mat3(uViewMatrix)); 
    texCoords = vec3(-position.x, position.y, position.z);
    gl_Position = uProjectionMatrix * viewRot * position;
}