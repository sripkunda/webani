#version 300 es
precision mediump float;

in vec2 position;
out vec2 fragCoord;

void main() {
    fragCoord = position * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0, 1.0);
}