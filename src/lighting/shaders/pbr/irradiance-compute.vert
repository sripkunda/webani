#version 300 es
precision mediump float;

in vec4 position;  
out vec4 fragPos; 
uniform mat4 uViewMatrix;

void main() {
    mat4 viewRot = mat4(mat3(uViewMatrix));
    fragPos = position;
    gl_Position = viewRot * position;
}