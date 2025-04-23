import { GLBParserBufferView } from "./glb-parser-buffer-view.type"

export type GLBParserBinaryBufferReadResult = {
    bufferView: GLBParserBufferView
    dataView: DataView
    byteOffset: number
    byteLength: number
    accessorCount: number,
    componentType: number,
    type: string,
    typeSize: number, 
    componentSize: number,
    byteStride: number
}