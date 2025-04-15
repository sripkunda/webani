export class WebaniSkybox {
    hdrImage: HTMLImageElement | ImageBitmap | null;
    environmentMap: WebGLTexture | null;
    irradianceMap: WebGLTexture | null;
    prefilterMap: WebGLTexture | null;
    brdfLUT: WebGLTexture | null;

    constructor(hdrImage: HTMLImageElement | ImageBitmap | null) {
        this.hdrImage = hdrImage;
    }
}
