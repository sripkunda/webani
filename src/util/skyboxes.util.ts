import skyboxPath from './example-skybox.png';
 
export let defaultSkybox: ImageBitmap | null = null;

export async function loadSkybox(path: string) {
    try {
        const response = await fetch(path);
        const blob = await response.blob();
        return await createImageBitmap(blob);
    } catch (error) {
        console.warn("Failed to load default skybox.", error);
    }
}

defaultSkybox = await loadSkybox(skyboxPath);