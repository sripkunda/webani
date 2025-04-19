import face0 from './example-skybox/skybox_face_0.jpg';
import face1 from './example-skybox/skybox_face_1.jpg';
import face2 from './example-skybox/skybox_face_2.jpg';
import face3 from './example-skybox/skybox_face_3.jpg';
import face4 from './example-skybox/skybox_face_4.jpg';
import face5 from './example-skybox/skybox_face_5.jpg';
 
export let defaultSkybox: ImageBitmap[] | null = null;

export async function loadSkybox(...paths: string[]) {
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

defaultSkybox = await loadSkybox(face0, face1, face2, face3, face4, face5);