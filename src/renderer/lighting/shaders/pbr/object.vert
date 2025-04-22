#version 300 es
precision mediump float;

// Input attributes
in vec4 position;
in vec3 normal;
in vec2 uv;

uniform mat4 uProjectionMatrix; 
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

// Output to fragment shader
out vec3 fragPos;
out vec3 fragNormal;
out vec2 vertexUV;

void main() {
    fragPos = (uModelMatrix * position).xyz;
    fragNormal = normalize(mat3(transpose(inverse(uModelMatrix))) * normal);
    vertexUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * position;
    gl_PointSize = 2.0;
}