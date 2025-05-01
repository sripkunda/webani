import { GLBParserAnimationChannel } from "./glb-parser-animation-channel.type";
import { GLBParserAnimationSampler } from "./glb-parser-animation-sampler.type";

export type GLBParserAnimationData = {
  name?: string;
  samplers: GLBParserAnimationSampler[];
  channels: GLBParserAnimationChannel[];
}