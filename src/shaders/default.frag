precision mediump float;

// Uniforms
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uViewPosition;

// Varyings from vertex shader
varying vec3 vNormal;
varying vec3 vFragPosition;

// Material properties
uniform vec3 uMaterialAmbient;
uniform vec3 uMaterialDiffuse;
uniform vec3 uMaterialSpecular;
uniform float uMaterialShininess;
uniform vec3 uMaterialColor;
uniform float opacity;

void main() {
    // Normalize vectors
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vFragPosition);
    vec3 viewDir = normalize(uViewPosition - vFragPosition);
    
    // Compute diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uMaterialDiffuse * uLightColor * uLightIntensity;
    
    // Compute specular component
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uMaterialShininess);
    vec3 specular = spec * uMaterialSpecular * uLightColor * uLightIntensity;
    
    // Combine lighting components with material color
    vec3 ambient = uMaterialAmbient * uLightColor * uLightIntensity;
    vec3 result = ambient + diffuse + specular;
    
    // Apply material color
    result *= uMaterialColor;  // Material color applied to the final result
    
    gl_FragColor = vec4(result, opacity);
}