#version 300 es
precision mediump float;

// Input attributes
in vec4 position;
in vec3 normal;

uniform mat4 uProjectionMatrix; 
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

// Output to fragment shader
out vec3 fragPos;
out vec3 fragNormal;

void main() {
    fragPos = (uModelMatrix * position).xyz;
    fragNormal = normalize(mat3(transpose(inverse(uModelMatrix))) * normal);
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * position;
    gl_PointSize = 2.0;
}