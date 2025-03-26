export const fragmentShader = 
`#version 300 es
precision mediump float;
uniform vec4 color;
out vec4 fragColor;

void main() {
    fragColor = color;
}`

export const vertexShader = 
`#version 300 es
in vec4 position;

void main() {
    gl_Position = position;
    gl_PointSize = 2.0;
}`