import { WebaniMaterial } from "../renderer/lighting/webani-material.class";
import { Matrix4 } from "../types/matrix4.type";
import { Vector2 } from "../types/vector2.type";
import { Vector3 } from "../types/vector3.type";
import { VectorUtils } from "./vector.utils";

async function fetchGLBData(path: string): Promise<ArrayBuffer> {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Webani: Failed to fetch GLB file at ${path}. Status: ${res.status}`);
    }
    return await res.arrayBuffer();
}

function validateGLBHeader(dataView: DataView): void {
    const magic = new TextDecoder().decode(new Uint8Array(dataView.buffer, 0, 4));
    if (magic !== 'glTF') {
        throw new Error('Webani: File is not a valid GLB file.');
    }
}

function parseGLBJSON(dataView: DataView): any {
    const jsonLength = dataView.getUint32(12, true);
    const jsonStart = 20;
    const jsonChunk = new Uint8Array(dataView.buffer, jsonStart, jsonLength);
    const jsonText = new TextDecoder().decode(jsonChunk);
    return JSON.parse(jsonText);
}

function extractGLBBinary(dataView: DataView, jsonLength: number): Uint8Array {
    const jsonStart = 20;
    const binLength = dataView.getUint32(jsonStart + jsonLength, true);
    const binStart = jsonStart + jsonLength + 8;
    return new Uint8Array(dataView.buffer, binStart, binLength);
}

function extractJoints(gltf: any, skinIndex: number): number[] {
    const skin = gltf.skins?.[skinIndex];
    if (!skin) return [];
    return skin.joints || [];
}

function extractInverseBindMatrices(gltf: any, binaryBuffer: Uint8Array, skinIndex: number): Matrix4[] {
    const skin = gltf.skins?.[skinIndex];
    if (!skin || skin.inverseBindMatrices === undefined) return [];

    const { accessorCount: count, dataView, byteLength, byteOffset, byteStride } = readBinaryBuffer(gltf, binaryBuffer, skin.inverseBindMatrices);
    const inverseBindMatrices: Matrix4[] = [];

    for (let i = 0; i < count; i++) {
        const offset = byteOffset + i * byteStride;
        const matrix: Matrix4 = new Float32Array([
            dataView.getFloat32(offset + 0, true), dataView.getFloat32(offset + 4, true), dataView.getFloat32(offset + 8, true), dataView.getFloat32(offset + 12, true),
            dataView.getFloat32(offset + 16, true), dataView.getFloat32(offset + 20, true), dataView.getFloat32(offset + 24, true), dataView.getFloat32(offset + 28, true),
            dataView.getFloat32(offset + 32, true), dataView.getFloat32(offset + 36, true), dataView.getFloat32(offset + 40, true), dataView.getFloat32(offset + 44, true),
            dataView.getFloat32(offset + 48, true), dataView.getFloat32(offset + 52, true), dataView.getFloat32(offset + 56, true), dataView.getFloat32(offset + 60, true),
        ]) as Matrix4;
        inverseBindMatrices.push(matrix);
    }

    return inverseBindMatrices;
}


function getAccessor(gltf: any, index: number) {
    const accessor = gltf.accessors?.[index];
    if (!accessor || accessor.bufferView === undefined) return undefined;
    return accessor;
}

function getComponentSize(componentType: number): number | undefined {
    const sizes: Record<number, number> = {
        5120: 1,
        5121: 1, 
        5122: 2,
        5123: 2, 
        5125: 4,
        5126: 4
    };
    return sizes[componentType];
}

function getTypeSize(type: string): number | undefined {
    const typeSizes: Record<string, number> = {
        SCALAR: 1,
        VEC2: 2,
        VEC3: 3,
        VEC4: 4,
        MAT2: 4,
        MAT3: 9,
        MAT4: 16
    };
    return typeSizes[type];
}

export function readBinaryBuffer(gltf: any, binaryBuffer: Uint8Array, accessorIndex: number) {
    const accessor = getAccessor(gltf, accessorIndex);
    if (!accessor) return undefined;

    const bufferView = gltf.bufferViews[accessor.bufferView];
    const componentSize = getComponentSize(accessor.componentType);
    const typeSize = getTypeSize(accessor.type);

    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength = bufferView.byteLength;
    const byteStride = bufferView.byteStride || (componentSize * typeSize);

    const dataView = new DataView(
        binaryBuffer.buffer,
        binaryBuffer.byteOffset,
        binaryBuffer.byteLength
    );

    return {
        bufferView,
        dataView,
        byteOffset,
        byteLength,
        accessorCount: accessor.count,
        componentType: accessor.componentType,
        type: accessor.type,
        byteStride
    };
}

function extractAttributeData(gltf: any, binaryBuffer: Uint8Array, accessorIndex: number): number[][] {
    if (accessorIndex === undefined) return [];
    const {
        bufferView,
        dataView, 
        byteOffset,
        byteLength,
        accessorCount,
        componentType,
        type,
        byteStride
    } = readBinaryBuffer(gltf, binaryBuffer, accessorIndex);
    
    const result: number[][] = [];

    for (let i = 0; i < accessorCount; i++) {
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
}

function extractIndicesData(gltf: any, binaryBuffer: Uint8Array, indicesAccessorIndex: number, vertices: Vector3[], normals: Vector3[], uvs: Vector2[]): { vertices: Vector3[], normals: Vector3[], uvs: Vector2[] } {
    let triangleVertices: Vector3[] = [];
    let triangleVertexNormals: Vector3[] = [];
    let triangleUVs: Vector2[] = [];

    if (indicesAccessorIndex !== undefined) {
        const {
            bufferView,
            dataView, 
            byteOffset,
            accessorCount,
            byteLength,
            componentType,
            byteStride
        } = readBinaryBuffer(gltf, binaryBuffer, indicesAccessorIndex);

        for (let i = 0; i < accessorCount; i++) {
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

    return { vertices: triangleVertices, normals: triangleVertexNormals, uvs: triangleUVs };
}

async function loadImageBitmap(url: string): Promise<ImageBitmap> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch image: ${url}. Status: ${res.status}`);
    }
    const blob = await res.blob();
    return await createImageBitmap(blob);
}

async function getImageBitmapFromBufferView(gltf: any, binaryBuffer: Uint8Array, bufferViewIndex: number, mimeType: string): Promise<ImageBitmap> {
    const view = gltf.bufferViews[bufferViewIndex];
    const start = view.byteOffset || 0;
    const end = start + view.byteLength;
    const imageData = binaryBuffer.slice(start, end);
    const blob = new Blob([imageData], { type: mimeType });
    return await createImageBitmap(blob);
}

async function getImageBitmapFromTextureIndex(texIndex: number | undefined, gltf: any, binaryBuffer: Uint8Array, path: string): Promise<ImageBitmap | undefined> {
    if (texIndex === undefined) return undefined;
    const texture = gltf.textures?.[texIndex];
    if (!texture) return;

    const image = gltf.images?.[texture.source];
    if (!image) return;

    if (image.bufferView !== undefined) {
        const mime = image.mimeType || "image/png";
        return await getImageBitmapFromBufferView(gltf, binaryBuffer, image.bufferView, mime);
    }

    if (image.uri) {
        if (image.uri.startsWith("data:")) {
            return await createImageBitmap(await fetch(image.uri).then(res => res.blob()));
        } else {
            const base = path.substring(0, path.lastIndexOf("/") + 1);
            const url = base + image.uri;
            return await loadImageBitmap(url);
        }
    }
    return undefined;
}

async function extractMaterialProperties(primitive: any, gltf: any, binaryBuffer: Uint8Array, path: string): Promise<WebaniMaterial> {
    const material = new WebaniMaterial({});

    if (primitive.material !== undefined) {
        const mat = gltf.materials[primitive.material];
        const pbr = mat.pbrMetallicRoughness || {};

        if (pbr.baseColorFactor) {
            material.color = VectorUtils.convertPointTo3D(pbr.baseColorFactor);
        }

        if (pbr.metallicFactor !== undefined) {
            material.metallic = pbr.metallicFactor;
        }
        if (pbr.roughnessFactor !== undefined) {
            material.roughness = pbr.roughnessFactor;
        }

        material.baseColorImage = await getImageBitmapFromTextureIndex(
            pbr.baseColorTexture?.index,
            gltf,
            binaryBuffer,
            path
        );
        material.metallicRoughnessImage = await getImageBitmapFromTextureIndex(
            pbr.metallicRoughnessTexture?.index,
            gltf,
            binaryBuffer,
            path
        );
        material.normalMapImage = await getImageBitmapFromTextureIndex(
            mat.normalTexture?.index,
            gltf,
            binaryBuffer,
            path
        );
        if (mat.normalTexture?.scale !== undefined) {
            material.normalScale = mat.normalTexture.scale;
        }
    }

    return material;
}

function extractAnimationTracks(animation: any, gltf: any, binaryBuffer: Uint8Array): Record<string, { times: number[], values: number[][], path: string }> {
    const tracks: Record<string, { times: number[], values: number[][], path: string }> = {};

    for (const channel of animation.channels) {
        const sampler = animation.samplers[channel.sampler];
        const targetNode = gltf.nodes[channel.target.node];
        const path = channel.target.path;

        const inputAccessor = gltf.accessors[sampler.input];
        const outputAccessor = gltf.accessors[sampler.output];

        const inputBufferView = gltf.bufferViews[inputAccessor.bufferView];
        const outputBufferView = gltf.bufferViews[outputAccessor.bufferView];

        const inputByteOffset = (inputBufferView.byteOffset || 0) + (inputAccessor.byteOffset || 0);
        const outputByteOffset = (outputBufferView.byteOffset || 0) + (outputAccessor.byteOffset || 0);

        const inputCount = inputAccessor.count;
        const outputCount = outputAccessor.count;

        const inputTimes: number[] = [];
        const outputValues: number[][] = [];

        const inputView = new DataView(binaryBuffer.buffer, binaryBuffer.byteOffset + inputByteOffset, inputCount * 4);
        for (let i = 0; i < inputCount; i++) {
            inputTimes.push(inputView.getFloat32(i * 4, true));
        }

        const typeSize = { "SCALAR": 1, "VEC3": 3, "VEC4": 4 }[outputAccessor.type];
        if (!typeSize) continue;

        const outputView = new DataView(binaryBuffer.buffer, binaryBuffer.byteOffset + outputByteOffset, outputCount * 4 * typeSize);
        for (let i = 0; i < outputCount; i++) {
            const frame: number[] = [];
            for (let j = 0; j < typeSize; j++) {
                frame.push(outputView.getFloat32((i * typeSize + j) * 4, true));
            }
            outputValues.push(frame);
        }

        tracks[`${targetNode.name || "node_" + channel.target.node}_${path}`] = {
            times: inputTimes,
            values: outputValues,
            path: path
        };
    }
    return tracks;
}

function extractAnimations(gltf: any, binaryBuffer: Uint8Array): any[] {
    return (gltf.animations || []).map((animation: any, index: number) => ({
        name: animation.name || index,
        tracks: extractAnimationTracks(animation, gltf, binaryBuffer)
    }));
}

export async function importGLB(path: string) {
    const arrayBuffer = await fetchGLBData(path);
    const dataView = new DataView(arrayBuffer);

    validateGLBHeader(dataView);

    const gltf = parseGLBJSON(dataView);
    const jsonLength = new DataView(arrayBuffer.slice(12, 16)).getUint32(0, true);
    const binaryBuffer = extractGLBBinary(dataView, jsonLength);

    const primitive = gltf.meshes[0].primitives[0];

    const vertices = extractAttributeData(gltf, binaryBuffer, primitive.attributes?.POSITION) as Vector3[];
    const normals = extractAttributeData(gltf, binaryBuffer, primitive.attributes?.NORMAL) as Vector3[];
    const uvs = extractAttributeData(gltf, binaryBuffer, primitive.attributes?.TEXCOORD_0) as Vector2[];

    const { vertices: triangleVertices, normals: triangleVertexNormals, uvs: triangleUVs } = extractIndicesData(
        gltf,
        binaryBuffer,
        primitive.indices,
        vertices,
        normals,
        uvs
    );

    const material = await extractMaterialProperties(primitive, gltf, binaryBuffer, path);
    const animations = extractAnimations(gltf, binaryBuffer);
    
    return {
        triangles: triangleVertices,
        normals: triangleVertexNormals,
        uvs: triangleUVs,
        material: material,
        animations: animations,
    };
}