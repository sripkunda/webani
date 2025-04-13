#version 300 es
precision mediump float;

// Uniforms
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uViewPosition;   

// Varyings from vertex shader
in vec3 vertexPosition; 
in vec3 vertexNormal;

// Material properties
uniform vec3 uMaterialAmbient;
uniform vec3 uMaterialDiffuse;
uniform vec3 uMaterialSpecular;
uniform float uMaterialShininess;
uniform vec3 uMaterialColor;
uniform float uMaterialOpacity;

out vec4 outColor;

void main() {
    vec3 normal = normalize(vertexNormal);
    vec3 lightDir = normalize(uLightPosition - vertexPosition);
    vec3 viewDir = normalize(uViewPosition - vertexPosition);

    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uMaterialDiffuse;
    
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uMaterialShininess);
    vec3 specular = spec * uMaterialSpecular;
    
    vec3 result = (uMaterialAmbient + diffuse + specular) * uLightColor * uLightIntensity;
    
    result *= uMaterialColor;

    outColor = vec4(result, uMaterialOpacity);
}