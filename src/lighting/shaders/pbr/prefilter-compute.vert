#version 300 es
precision mediump float;

in vec4 position;
out vec4 fragPos;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    mat4 viewRot = mat4(mat3(uViewMatrix));
    fragPos = vec4(position.x, -position.y, position.z, position.w);
    gl_Position = uProjectionMatrix * viewRot * position;
}