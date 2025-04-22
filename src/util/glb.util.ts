import { WebaniMaterial } from "../renderer/lighting/webani-material.class";
import { Vector2 } from "../types/vector2.type";
import { Vector3 } from "../types/vector3.type";
import { VectorUtils } from "./vector.utils";

export async function importGLB(path: string) {
    const res = await fetch(path);
    const arrayBuffer = await res.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    const magic = new TextDecoder().decode(new Uint8Array(arrayBuffer, 0, 4));
    if (magic !== 'glTF') throw new Error('Webani: File is not a valid GLB file.');

    const jsonLength = dataView.getUint32(12, true);
    const jsonStart = 20;
    const jsonChunk = new Uint8Array(arrayBuffer, jsonStart, jsonLength);
    const jsonText = new TextDecoder().decode(jsonChunk);
    const gltf = JSON.parse(jsonText);

    const binLength = dataView.getUint32(jsonStart + jsonLength, true);
    const binStart = jsonStart + jsonLength + 8;
    const binaryBuffer = new Uint8Array(arrayBuffer, binStart, binLength);

    const primitive = gltf.meshes[0].primitives[0];

    const extractAttribute = (semantic: string, type: string = "VEC3"): Vector3[] | Vector2[] => {
        const accessorIndex = primitive.attributes[semantic];
        if (accessorIndex === undefined) return [];

        const accessor = gltf.accessors[accessorIndex];
        const bufferView = gltf.bufferViews[accessor.bufferView];

        const componentType = accessor.componentType;
        const count = accessor.count;

        const expectedTypeSizes: Record<string, number> = { "VEC2": 2, "VEC3": 3 };
        const expectedStride = expectedTypeSizes[type] * 4;

        if (componentType !== 5126 || accessor.type !== type) {
            throw new Error(`Unsupported attribute format: type=${accessor.type}, componentType=${componentType}`);
        }

        const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
        const byteStride = bufferView.byteStride || expectedStride;
        const dataView = new DataView(binaryBuffer.buffer, binaryBuffer.byteOffset, binaryBuffer.byteLength);
        
        const result: any[] = [];
        for (let i = 0; i < count; i++) {
            const offset = byteOffset + i * byteStride;
            if (type === "VEC2") {
                const x = dataView.getFloat32(offset, true);
                const y = dataView.getFloat32(offset + 4, true);
                result.push([x, y]);
            } else if (type === "VEC3") {
                const x = dataView.getFloat32(offset, true);
                const y = dataView.getFloat32(offset + 4, true);
                const z = dataView.getFloat32(offset + 8, true);
                result.push([x, y, z]);
            }
        }
        return result;
    };

    const vertices = extractAttribute("POSITION") as Vector3[];
    const normals = extractAttribute("NORMAL") as Vector3[];
    const uvs = extractAttribute("TEXCOORD_0", "VEC2") as Vector2[];

    let triangleVertices: Vector3[] = [];
    let triangleVertexNormals: Vector3[] = [];
    let triangleUVs: Vector2[] = [];

    if (primitive.indices !== undefined) {
        const accessor = gltf.accessors[primitive.indices];
        const bufferView = gltf.bufferViews[accessor.bufferView];

        const componentType = accessor.componentType;
        const count = accessor.count;
        const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
        const byteStride = {
            5121: 1,
            5123: 2,
            5125: 4 
        }[componentType];

        const dataView = new DataView(binaryBuffer.buffer, binaryBuffer.byteOffset, binaryBuffer.byteLength);
        
        for (let i = 0; i < count; i++) {
            const offset = byteOffset + i * byteStride;
            let index: number;
            if (componentType === 5121) {
                index = dataView.getUint8(offset);
            } else if (componentType === 5123) {
                index = dataView.getUint16(offset, true);
            } else if (componentType === 5125) {
                index = dataView.getUint32(offset, true);
            } else {
                throw new Error("Unsupported index component type");
            }
            triangleVertices.push(vertices[index]);
            triangleVertexNormals.push(normals[index]);
            triangleUVs.push(uvs[index]);
        }
    } else {
        triangleVertices = vertices;
        triangleVertexNormals = normals;
        triangleUVs = uvs;
    }

    async function getImageBitmapFromTextureIndex(
        texIndex: number | undefined,
        gltf: any,
        binaryBuffer: Uint8Array,
        path: string
    ): Promise<ImageBitmap | undefined> {
        if (texIndex === undefined) return undefined;
        const texture = gltf.textures?.[texIndex];
        if (!texture) return;

        const image = gltf.images?.[texture.source];
        if (!image) return;

        if (image.bufferView !== undefined) {
            const view = gltf.bufferViews[image.bufferView];
            const mime = image.mimeType || "image/png";
            const start = view.byteOffset || 0;
            const end = start + view.byteLength;
            const imageData = binaryBuffer.slice(start, end);
            const blob = new Blob([imageData], { type: mime });
            return await createImageBitmap(blob);
        }

        if (image.uri) {
            let url: string;
            if (image.uri.startsWith("data:")) {
                url = image.uri;
            } else {
                const base = path.substring(0, path.lastIndexOf("/") + 1);
                url = base + image.uri;
            }
            const img = await fetch(url).then(res => res.blob());
            return await createImageBitmap(img);
        }
    }

    let material = new WebaniMaterial({});
    if (primitive.material !== undefined) {
        const mat = gltf.materials[primitive.material];
        const pbr = mat.pbrMetallicRoughness || {};
    
        // Colors
        if (pbr.baseColorFactor) {
            material.color = VectorUtils.convertPointTo3D(pbr.baseColorFactor);
        }
    
        // Factors
        if (pbr.metallicFactor !== undefined) {
            material.metallic = pbr.metallicFactor;
        }
        if (pbr.roughnessFactor !== undefined) {
            material.roughness = pbr.roughnessFactor;
        }
    
        // Textures
        material.baseColorTexture = await getImageBitmapFromTextureIndex(
            pbr.baseColorTexture?.index,
            gltf,
            binaryBuffer,
            path
        );
        material.metallicRoughnessTexture = await getImageBitmapFromTextureIndex(
            pbr.metallicRoughnessTexture?.index,
            gltf,
            binaryBuffer,
            path
        );
        material.normalMap = await getImageBitmapFromTextureIndex(
            mat.normalTexture?.index,
            gltf,
            binaryBuffer,
            path
        );
        if (mat.normalTexture?.scale !== undefined) {
            material.normalScale = mat.normalTexture.scale;
        }
    }

    return {
        triangles: triangleVertices,
        normals: triangleVertexNormals,
        uvs: triangleUVs,
        material: material
    };
}
