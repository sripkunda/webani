#version 300 es
precision mediump float;

// Input attributes
in vec4 position;
in vec3 normal;

uniform mat4 projectionMatrix; 
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

// Output to fragment shader
out vec3 vertexPosition;
out vec3 vertexNormal;

void main() {
    vertexPosition = (modelMatrix * position).xyz;
    vertexNormal = normalize(mat3(transpose(inverse(modelMatrix))) * normal);
    
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    gl_PointSize = 2.0;
}