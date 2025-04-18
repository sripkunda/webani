#version 300 es
precision mediump float;

in vec4 fragPos;
out vec4 outColor;

uniform samplerCube uCubeMap;
uniform float uDeltaTheta;

const float PI = 3.14159265359;

void main() {
    vec3 N = normalize(fragPos.xyz);
    vec3 up = abs(N.y) < 0.999 ? vec3(0,1.0,0) : vec3(1.0,0,0);
    vec3 T  = normalize(cross(up, N));
    vec3 B  = normalize(cross(N, T));
    
    vec3 totalIrradiance = vec3(0.0);
    float numSamples = 0.0;
    for (float phi = 0.0; phi < 2.0 * PI; phi += uDeltaTheta) {
        for (float theta = 0.0; theta < PI / 2.0; theta += uDeltaTheta) {
            vec3 H = T * (sin(theta) * cos(phi)) + B * (sin(theta) * sin(phi)) + N * cos(theta);
            vec3 L = texture(uCubeMap, H).rgb;
            totalIrradiance += L * sin(theta) * cos(theta);
            numSamples++;
        }
    }

    outColor = vec4(totalIrradiance * PI / numSamples, 1.0);
}