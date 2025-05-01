import { SVGCommandList } from "./svg-command-list.type"
import { SVGTransformation } from "./svg-transformation.type"

export type TransformedSVGCommandList = {
    commands: SVGCommandList,
    transformation: SVGTransformation
}