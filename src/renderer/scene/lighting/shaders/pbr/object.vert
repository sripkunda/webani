#version 300 es
precision mediump float;

const int MAX_JOINTS = 64;

in vec4 position;
in vec3 normal;
in vec2 uv;

in vec4 weights; 
in vec4 jointIndices;

uniform mat4 uProjectionMatrix; 
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

uniform mat4 jointMatrices[MAX_JOINTS];
uniform mat4 inverseBindMatrices[MAX_JOINTS];
uniform bool performSkinningTransformation;

out vec3 fragPos;
out vec3 fragNormal;
out vec2 vertexUV;

void main() {
    vec4 transformedPos = position;
    if (performSkinningTransformation) {
        transformedPos = vec4(0.0);
        for (int i = 0; i < 4; i++) { 
            int jointIndex = int(jointIndices[i]);
            transformedPos += weights[i] * jointMatrices[jointIndex] * inverseBindMatrices[jointIndex] * position;
        }
    }
    fragPos = (uModelMatrix * transformedPos).xyz;
    fragNormal = normalize(mat3(transpose(inverse(uModelMatrix))) * normal);
    vertexUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * transformedPos;
    gl_PointSize = 2.0;
}