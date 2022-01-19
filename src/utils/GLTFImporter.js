// import * as THREE from 'three'
import {
    GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';
import {
    DRACOLoader
} from 'three/examples/jsm/loaders/DRACOLoader';

const loader = new GLTFLoader()

// Loading multiple Files
// https://discourse.threejs.org/t/help-possible-to-load-multiple-gltf-objects-on-a-single-loader/9516/8

// Optional: Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader();

export default async function loadGLTF(models) {
    dracoLoader.setDecoderPath('/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);
    
    
    const [model, model1, model2] = await Promise.all([
        loader.loadAsync('/models/' + models[0]),
        loader.loadAsync('/models/' + models[1]),
        loader.loadAsync('/models/' + models[2]),
        loader.loadAsync('/models/' + models[3]),
    ]);

    return {
        model1: model.scene.children[0],
        model2: model1.scene.children[0],
        model3: model2.scene.children[0],
        model4: model.scene.children[0],
    }
}