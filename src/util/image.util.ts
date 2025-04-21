export async function loadImage(...paths: string[]) {
    const images = [];
    for (let path of paths) { 
        try {
            const response = await fetch(path);
            const blob = await response.blob();
            images.push(await createImageBitmap(blob));
        } catch (error) {
            console.warn("Failed to load default skybox.", error);
        }
    }
    return images;
}