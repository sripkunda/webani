#version 300 es
precision highp float;

in vec3 fragDir;
out vec4 fragColor;

uniform samplerCube uCubeMap;
uniform float uDeltaTheta;

void main() {
    // Cosine-weighted hemisphere sampling
    vec3 normal = normalize(fragDir);  // Assuming fragDir is the surface normal
    vec3 sampleDir;
    float totalIrradiance = 0.0;

    for (float theta = 0.0; theta < 3.14159; theta += uDeltaTheta) {
        for (float phi = 0.0; phi < 2.0 * 3.14159; phi += uDeltaTheta) {
            sampleDir = vec3(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
            float sample = texture(uCubeMap, sampleDir).r; // Only using the red channel for irradiance
            totalIrradiance += sample * max(dot(normal, sampleDir), 0.0) * sin(theta) * uDeltaTheta * uDeltaTheta;
        }
    }

    fragColor = vec4(totalIrradiance, totalIrradiance, totalIrradiance, 1.0);
}