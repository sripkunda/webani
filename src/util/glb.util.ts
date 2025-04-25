import { WebaniMaterial } from "../renderer/scene/lighting/webani-material.class";
import { GLBParserAccessor } from "../types/glb-parser-accessor.type";
import { GLBParserAnimationData } from "../types/glb-parser-animation-data.type";
import { GLBParserAnimationTrack } from "../types/glb-parser-animation-track.type";
import { GLBParserBinaryBufferReadResult } from "../types/glb-parser-binary-buffer-read-result.type";
import { GLBParserJSON } from "../types/glb-parser-json.type";
import { GLBParserNode } from "../types/glb-parser-node.type";
import { GLBParserPrimitive } from "../types/glb-parser-primitive.type";
import { GLBParserResultAnimation } from "../types/glb-parser-result-animation.type";
import { GLBParserResultSkinData } from "../types/glb-parser-result-skin-data.type";
import { GLBParserResult } from "../types/glb-parser-result.type";
import { Matrix4 } from "../types/matrix4.type";
import { Vector2 } from "../types/vector2.type";
import { Vector3 } from "../types/vector3.type";
import { Vector4 } from "../types/vector4.type";
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

function parseGLBJSON(dataView: DataView): GLBParserJSON {
    const jsonLength = dataView.getUint32(12, true);
    const jsonStart = 20;
    const jsonChunk = new Uint8Array(dataView.buffer, jsonStart, jsonLength);
    const jsonText = new TextDecoder().decode(jsonChunk);
    return JSON.parse(jsonText) as GLBParserJSON;
}

function extractGLBBinary(dataView: DataView, jsonLength: number): Uint8Array {
    const jsonStart = 20;
    const binLength = dataView.getUint32(jsonStart + jsonLength, true);
    const binStart = jsonStart + jsonLength + 8;
    return new Uint8Array(dataView.buffer, binStart, binLength);
}

function extractNodes(gltf: GLBParserJSON): GLBParserNode[] { 
    return gltf.nodes;
}

function extractSkin(gltf: GLBParserJSON, binaryBuffer: Uint8Array): GLBParserResultSkinData {
    const node = gltf.nodes.find(node => node.mesh == 0);
    return {
        joints: node !== undefined ? extractJoints(gltf, node.skin) : undefined,
        inverseBindMatrices: node !== undefined ? extractInverseBindMatrices(gltf, binaryBuffer, node.skin): undefined
    }
}

function extractJoints(gltf: GLBParserJSON, skinIndex: number): number[] {
    const skin = gltf.skins?.[skinIndex];
    if (!skin) return [];
    return skin.joints;
}

function extractInverseBindMatrices(gltf: GLBParserJSON, binaryBuffer: Uint8Array, skinIndex: number): Matrix4[] {
    const skin = gltf.skins?.[skinIndex];
    if (!skin || skin.inverseBindMatrices === undefined) return [];

    const { accessorCount: count, dataView, byteOffset, byteStride, readFunction, componentSize } = readBinaryBuffer(gltf, binaryBuffer, skin.inverseBindMatrices);
    const inverseBindMatrices: Matrix4[] = [];
    for (let i = 0; i < count; i++) {
        const offset = byteOffset + i * byteStride;
        const matrix: Matrix4 = new Float32Array([
            readFunction(offset, true), readFunction(offset + componentSize, true), readFunction(offset + componentSize * 2, true), readFunction(offset + componentSize * 3, true),
            readFunction(offset + componentSize * 4, true), readFunction(offset + componentSize * 5, true), readFunction(offset + componentSize * 6, true), readFunction(offset + componentSize * 7, true),
            readFunction(offset + componentSize * 8, true), readFunction(offset + componentSize * 9, true), readFunction(offset + componentSize * 10, true), readFunction(offset + componentSize * 11, true),
            readFunction(offset + componentSize * 12, true), readFunction(offset + componentSize * 13, true), readFunction(offset + componentSize * 14, true), readFunction(offset + componentSize * 15, true),
        ]) as Matrix4;
        inverseBindMatrices.push(matrix);
    }
    return inverseBindMatrices;
}

function getAccessor(gltf: GLBParserJSON, index: number): GLBParserAccessor {
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

function getComponentReadFunction(componentType: number, dataView: DataView) {
    const functions: Record<number, (byteOffset: number, littleEndian?: boolean) => number> = {
        5120: dataView.getInt8,
        5121: dataView.getUint8, 
        5122: dataView.getInt16,
        5123: dataView.getUint16, 
        5125: dataView.getUint32,
        5126: dataView.getFloat32
    };
    return functions[componentType];
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

export function readBinaryBuffer(gltf: GLBParserJSON, binaryBuffer: Uint8Array, accessorIndex: number): GLBParserBinaryBufferReadResult {
    const accessor = getAccessor(gltf, accessorIndex);
    if (!accessor) return undefined;

    const componentType = accessor.componentType;
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const componentSize = getComponentSize(componentType);
    const typeSize = getTypeSize(accessor.type);
    
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength = bufferView.byteLength;
    const byteStride = bufferView.byteStride || (componentSize * typeSize);
    
    const dataView = new DataView(
        binaryBuffer.buffer,
        binaryBuffer.byteOffset,
        binaryBuffer.byteLength
    );

    const readFunction = getComponentReadFunction(componentType, dataView).bind(dataView);

    return {
        bufferView,
        dataView,
        byteOffset,
        byteLength,
        accessorCount: accessor.count,
        componentType,
        type: accessor.type,
        readFunction,
        typeSize, 
        componentSize,
        byteStride
    };
}

function extractAttributeData(gltf: GLBParserJSON, binaryBuffer: Uint8Array, accessorIndex: number): number[][] {
    if (accessorIndex === undefined) return [];
    const {
        dataView, 
        byteOffset,
        accessorCount,
        type,
        componentSize,
        byteStride,
        readFunction
    } = readBinaryBuffer(gltf, binaryBuffer, accessorIndex);

    const result: number[][] = [];
    for (let i = 0; i < accessorCount; i++) {
        const offset = byteOffset + i * byteStride;
        if (type === "VEC2") {
            const x = readFunction(offset, true);
            const y = readFunction(offset + componentSize, true);
            result.push([x, y]);
        } else if (type === "VEC3") {
            const x = readFunction(offset, true);
            const y = readFunction(offset + componentSize, true);
            const z = readFunction(offset + 2 * componentSize, true);
            result.push([x, y, z]);
        } else if (type == "VEC4") { 
            const x = readFunction(offset, true);
            const y = readFunction(offset + componentSize, true);
            const z = readFunction(offset + 2 * componentSize, true);
            const w = readFunction(offset + 3 * componentSize, true);
            result.push([x, y, z, w]);
        }
    }
    return result;
}

function extractIndicesData(gltf: GLBParserJSON, binaryBuffer: Uint8Array, indicesAccessorIndex: number, arrays: { [name: string]: Vector3[] | Vector2[] | Vector4[] }) {
    if (indicesAccessorIndex !== undefined) {
        const triangleArrays = Object.fromEntries(Object.keys(arrays).map(key => [key, []]));
        const {
            dataView, 
            byteOffset,
            accessorCount,
            componentType,
            byteStride,
            readFunction
        } = readBinaryBuffer(gltf, binaryBuffer, indicesAccessorIndex);

        for (let i = 0; i < accessorCount; i++) {
            const offset = byteOffset + i * byteStride;
            let index = readFunction(offset, true);

            for (const key in arrays) { 
                triangleArrays[key].push(arrays[key][index]);
            }
        }
        return triangleArrays;
    }
    return arrays;
}

async function loadImageBitmap(url: string): Promise<ImageBitmap> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch image: ${url}. Status: ${res.status}`);
    }
    const blob = await res.blob();
    return await createImageBitmap(blob);
}

async function getImageBitmapFromBufferView(gltf: GLBParserJSON, binaryBuffer: Uint8Array, bufferViewIndex: number, mimeType: string): Promise<ImageBitmap> {
    const view = gltf.bufferViews[bufferViewIndex];
    const start = view.byteOffset || 0;
    const end = start + view.byteLength;
    const imageData = binaryBuffer.slice(start, end);
    const blob = new Blob([imageData], { type: mimeType });
    return await createImageBitmap(blob);
}

async function getImageBitmapFromTextureIndex(texIndex: number | undefined, gltf: GLBParserJSON, binaryBuffer: Uint8Array, path: string): Promise<ImageBitmap | undefined> {
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

async function extractMaterialProperties(primitive: GLBParserPrimitive, gltf: GLBParserJSON, binaryBuffer: Uint8Array, path: string): Promise<WebaniMaterial> {
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

function extractAnimationTracks(animation: GLBParserAnimationData, gltf: GLBParserJSON, binaryBuffer: Uint8Array): Record<string, GLBParserAnimationTrack> {
    const tracks: Record<string, GLBParserAnimationTrack> = {};

    for (const channel of animation.channels) {
        const sampler = animation.samplers[channel.sampler];
        const targetNode = gltf.nodes[channel.target.node];
        const path = channel.target.path;

        const {
            accessorCount: inputCount,
            dataView: inputView,
            componentSize: inputComponentSize,
            byteOffset: inputOffset,
            readFunction: inputReadFunction,
        } = readBinaryBuffer(gltf, binaryBuffer, sampler.input);

        const {
            accessorCount: outputCount,
            dataView: outputView,
            byteOffset: outputOffset,
            readFunction: outputReadFunction,
            typeSize,
            componentSize: outputComponentSize
        } = readBinaryBuffer(gltf, binaryBuffer, sampler.output);

        const inputTimes: number[] = [];
        const outputValues: number[][] = [];

        for (let i = 0; i < inputCount; i++) {
            inputTimes.push(inputReadFunction(inputOffset + i * inputComponentSize, true));
        }

        for (let i = 0; i < outputCount; i++) {
            const frame: number[] = [];
            for (let j = 0; j < typeSize; j++) {
                frame.push(outputReadFunction(outputOffset + (i * typeSize + j) * outputComponentSize, true));
            }
            outputValues.push(frame);
        }

        tracks[`${targetNode.name || "node_" + channel.target.node}_${path}`] = {
            times: inputTimes,
            values: outputValues,
            path: path,
            targetNodeIndex: channel.target.node
        };
    }
    return tracks;
}

function extractAnimations(gltf: GLBParserJSON, binaryBuffer: Uint8Array): GLBParserResultAnimation[] {
    return (gltf.animations || []).map((animation: GLBParserAnimationData, index: number) => ({
        name: animation.name || index,
        tracks: extractAnimationTracks(animation, gltf, binaryBuffer)
    }));
}

export async function importGLB(path: string): Promise<GLBParserResult> {
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
    const joints = extractAttributeData(gltf, binaryBuffer, primitive.attributes?.JOINTS_0) as Vector4[];
    const weights = extractAttributeData(gltf, binaryBuffer, primitive.attributes?.WEIGHTS_0) as Vector4[];
    
    const { vertices: triangleVertices, normals: triangleVertexNormals, uvs: triangleUVs, joints: triangleJoints, weights: triangleWeights } = extractIndicesData(
        gltf,
        binaryBuffer,
        primitive.indices,
        { vertices, normals, uvs, joints, weights }
    );
    
    const material = await extractMaterialProperties(primitive, gltf, binaryBuffer, path);
    const animations = extractAnimations(gltf, binaryBuffer);
    const nodes = extractNodes(gltf);
    const skin = extractSkin(gltf, binaryBuffer);
    
    return {
        vertexData: {
            triangles: triangleVertices,
            normals: triangleVertexNormals,
            uvs: triangleUVs,
            joints: triangleJoints, 
            weights: triangleWeights,
        },
        animationData: {
            skin: skin,
            nodes: nodes,
            animations: animations,
        },
        material: material,
    };
}