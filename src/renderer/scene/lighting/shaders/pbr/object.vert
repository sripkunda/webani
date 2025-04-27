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
    vec3 transformedNormal = normal;
    if (performSkinningTransformation) {
        transformedPos = vec4(0.0);
        transformedNormal = vec3(0.0);
        for (int i = 0; i < 4; i++) { 
            int jointIndex = int(jointIndices[i]);
            mat4 matrix = jointMatrices[jointIndex] * inverseBindMatrices[jointIndex];
            transformedPos += weights[i] * matrix * position;
            transformedNormal += weights[i] * mat3(transpose(inverse(matrix))) * normal;
        }
    }
    fragPos = (uModelMatrix * transformedPos).xyz;
    fragNormal = normalize(mat3(transpose(inverse(uModelMatrix))) * transformedNormal);
    vertexUV = uv;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * transformedPos;
    gl_PointSize = 2.0;
}