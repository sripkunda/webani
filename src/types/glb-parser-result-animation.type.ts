import { GLBParserAnimationTrack } from "./glb-parser-animation-track.type";

export type GLBParserResultAnimation = {
    name: string | number;
    tracks: Record<string, GLBParserAnimationTrack>;
};