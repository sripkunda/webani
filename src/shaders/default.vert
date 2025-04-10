#version 300 es
precision mediump float;

// Input attributes
in vec3 position;  // Vertex position
in vec3 normal;    // Vertex normal

// Uniforms
uniform mat4 uModelViewMatrix;  // Model-view matrix
uniform mat4 uProjectionMatrix; // Projection matrix

// Output to fragment shader
out vec3 fragPosition;  // Fragment position
out vec3 fragNormal;    // Fragment normal

void main() {
    gl_Position = position;
    gl_PointSize = 2.0;
}