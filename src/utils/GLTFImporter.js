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

export default async function loadGLTF(name) {
    dracoLoader.setDecoderPath('/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    
    const [model] = await Promise.all([
        loader.loadAsync('/models/' + name)
    ]);

    return model.scene.children[0]
}