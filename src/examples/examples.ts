import { loadImages } from '../util/image.util';
import face0 from './example-skybox/skybox_face_0.jpg';
import face1 from './example-skybox/skybox_face_1.jpg';
import face2 from './example-skybox/skybox_face_2.jpg';
import face3 from './example-skybox/skybox_face_3.jpg';
import face4 from './example-skybox/skybox_face_4.jpg';
import face5 from './example-skybox/skybox_face_5.jpg';
 
export const ExampleSkybox: ImageBitmap[] = await loadImages(face0, face1, face2, face3, face4, face5);