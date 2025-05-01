#version 300 es
precision mediump float;

in vec4 fragPos;

uniform samplerCube uCubeMap;
uniform float uRoughness;
uniform float uResolution;

out vec4 outColor;

const uint NUM_SAMPLES = 1024u;
const float PI = 3.14159265359;

float ggxDistribution(float NdotH, float roughness) {
    float a = roughness*roughness;
    float nom = a * a;
    float denom = (NdotH*NdotH * (a * a - 1.0) + 1.0);
    denom = PI * denom * denom;
    return nom / denom;
}

vec3 importanceSampleBRDF(vec2 random, vec3 normalVector, float roughness) {
    float a = roughness * roughness;
    float phi = 2.0 * PI * random.x;
    float cosTheta = sqrt((1.0 - random.y) / (1.0 + (a * a - 1.0) * random.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    vec3 cartesian = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
    vec3 up = abs(normalVector.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, normalVector));
    vec3 bitangent = normalize(cross(normalVector, tangent));
    vec3 sampleVec = cartesian.x * tangent + cartesian.y * bitangent + cartesian.z * normalVector;
    return normalize(sampleVec);
}

float radicalInverseVdc(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10;
}

vec2 hammersley(uint i, uint N) {
    return vec2(float(i)/float(N), radicalInverseVdc(i));
}

void main() {
    vec3 R = normalize(fragPos.xyz);
    vec3 N = R;
    vec3 V = R;

    float totalWeight = 0.0;
    vec3 prefilterColor = vec3(0.0);
    
    for (uint i = 0u; i < NUM_SAMPLES; i++) {
        vec2 rand = hammersley(i, NUM_SAMPLES);
        vec3 H = importanceSampleBRDF(rand, N, uRoughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);
        float NdotL = max(dot(N, L), 0.0);
        if (NdotL > 0.0) {
            float mipLevel = 0.0;
            if (uRoughness > 0.0) { 
                float NdotH = max(dot(N, H), 0.0);
                float HdotV = max(dot(H, V), 0.0);
                float D = ggxDistribution(NdotH, uRoughness);
                float pdf = (D * NdotH / (4.0 * HdotV)) + 0.0001;
                float saTexel = 2.0 * PI / (3.0 * uResolution * uResolution);
                float saSample = 1.0 / (float(NUM_SAMPLES) * pdf);
                mipLevel = 0.5 * log2(saSample / saTexel); 
            }
            prefilterColor += textureLod(uCubeMap, L, mipLevel).rgb * NdotL;
            totalWeight += NdotL;
        }
    }

    prefilterColor = totalWeight > 0.0 ? prefilterColor / totalWeight : vec3(0.0);
    outColor = vec4(prefilterColor, 1.0);
}