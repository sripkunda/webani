#version 300 es
precision mediump float;

const int MAX_LIGHT_COUNT = 256;
const float PI = 3.14159265359;
const float MAX_REFLECTION_LOD = 4.0;

uniform samplerCube uIrradianceMap;
uniform samplerCube uPrefilteredEnvMap;
uniform sampler2D uBrdfLUT;

uniform vec3 uMaterialColor;
uniform float uMaterialRoughness;
uniform float uMaterialMetallic;
uniform float uMaterialOpacity;

uniform sampler2D uBaseColorTexture;
uniform sampler2D uMetallicRoughnessTexture;
uniform sampler2D uNormalMap;

uniform bool uBaseColorTextureSupplied;
uniform bool uMetallicRoughnessTextureSupplied;
uniform bool uNormalMapSupplied;

uniform vec3 uLightPositions[MAX_LIGHT_COUNT]; 
uniform vec3 uLightColors[MAX_LIGHT_COUNT];
uniform float uLightIntensities[MAX_LIGHT_COUNT];
uniform int uNumLights; 


uniform vec3 uCameraPosition;

in vec3 fragPos; 
in vec3 fragNormal;
in vec2 vertexUV;

out vec4 outColor;

float geometrySchlickGGX(float NdotX, float roughness) {
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;
    float nom   = NdotX;
    float denom = NdotX * (1.0 - k) + k;
    return nom / denom;
}

float geometrySmith(float NdotV, float NdotL, float roughness) {
    float ggx1 = geometrySchlickGGX(NdotV, roughness);
    float ggx2 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}


float ggxDistribution(float NdotH, float roughness) {
    float a = roughness*roughness;
    float denom = (NdotH*NdotH * (a * a - 1.0) + 1.0);
    denom = PI * denom * denom;
    return a * a / denom;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 computeDiffuse(vec3 specularContribution, float metallic) { 
    return (vec3(1.0) - specularContribution) * (1.0 - metallic); 
}

vec3 computeLo(vec3 lightPos, vec3 lightColor, float lightIntensity, vec3 worldPos, vec3 N, vec3 V, vec3 F0, vec3 albedo, float metallic, float roughness) {
    float distance = length(lightPos - worldPos);
    if (distance <= 0.0) { 
        return vec3(0.0);
    }
    vec3 L = normalize(lightPos - worldPos);
    vec3 H = normalize(V + L);
    float attenuation = 1.0 / (distance * distance);
    vec3 radiance = lightColor * attenuation * lightIntensity;
    
    float NdotH = max(dot(N, H), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float HdotV = max(dot(H, V), 0.0);
    float D = ggxDistribution(NdotH, roughness); 
    float G = geometrySmith(NdotV, NdotL, roughness);
    vec3 F = fresnelSchlick(HdotV, F0);
    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 1e-3; 
    vec3 specular = numerator / denominator; 
    vec3 kD = computeDiffuse(F, metallic);
    return (kD * albedo / PI + specular) * radiance * NdotL;
}

vec3 computeF0(vec3 albedo, float metallic) { 
    return mix(vec3(0.04), albedo, metallic);
}

void main() {
    vec3 albedo = uMaterialColor;
    if (uBaseColorTextureSupplied) {
       albedo = texture(uBaseColorTexture, vertexUV).rgb;
    }
    float roughness = uMaterialRoughness;
    float metallic = uMaterialMetallic;
    if (uMetallicRoughnessTextureSupplied) { 
        vec2 metallicRoughness = texture(uMetallicRoughnessTexture, vertexUV).gb;
        roughness = metallicRoughness.x;
        metallic = metallicRoughness.y;
    }
    vec3 N = normalize(fragNormal);
    vec3 V = normalize(uCameraPosition - fragPos);
    vec3 R = normalize(reflect(-V, N));

    vec3 F0 = computeF0(albedo, metallic);
    vec3 Lo = vec3(0.0);
    for (int i = 0; i < uNumLights; i++) {
        Lo += computeLo(uLightPositions[i], uLightColors[i], uLightIntensities[i], fragPos, N, V, F0, albedo, metallic, roughness);
    }

    vec3 irradiance = texture(uIrradianceMap, N).rgb;
    float NdotV = max(dot(N, V), 0.0);
    vec3 F = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = computeDiffuse(F, metallic);
    vec3 diffuse = kD * irradiance * albedo; 
    
    vec3 prefilteredColor = textureLod(uPrefilteredEnvMap, R, roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(uBrdfLUT, vec2(NdotV, roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);
    vec3 ambient = (diffuse + specular);

    vec3 color = ambient + Lo;
    outColor = vec4(uMaterialOpacity * color, uMaterialOpacity);
} 
