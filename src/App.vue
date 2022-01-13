<template>
  <div></div>
</template>

<script>

import ForceGraph3D from '3d-force-graph';
import NetworkData from './data/network-relations.json'

import GLTFImporter from './utils/GLTFImporter'

// import { fogParsVert, fogVert, fogParsFrag, fogFrag } from "./shader/FogReplace";

import * as THREE from 'three'
// IMPORTANT TO IMPORT FROM JSM FILESET
const {CSS3DRenderer, CSS3DObject} = require('three/examples/jsm/renderers/CSS3DRenderer')

// import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";

import { GUI } from 'dat.gui'

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

export default {
  name: 'App',
  data() {
    return  {
      LAST_CLICKED_NODE : String,
      Graph: undefined,
      object : undefined,
      planeGemetry : new THREE.PlaneBufferGeometry( 1, 1 ),
      planeMaterial: new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide }),
      plane: new THREE.Object3D(),
      objectLOD: new THREE.LOD(),
      textLOD: new THREE.LOD(),
      nodes: []
    }
  },
  methods: {
    animate () {
      this.Graph.renderer().setAnimationLoop( this.render );
    },
    // Gets called every frame
		render () {
      this.Graph.renderer().render( this.Graph.scene(), this.Graph.camera());
      // plane.quaternion.copy(camera.quaternion);
		},
    addModelsToScene () {
      this.Graph.nodeThreeObject((node) => {     
        this.nodes.push(node)
        const cube = this.object.clone()
        const plane = this.plane.clone()

        const group = new THREE.Group()

        const color = cube.material.color.clone()
        color.setStyle(node.color)

        cube.material.color = color
        cube.material.metalness = 0.5;
        cube.position.set(0,0,0)
        cube.scale.set(2,2,2)
    
        plane.material.color = color

        const objectLOD = new THREE.LOD()
        const textLOD   = new THREE.LOD()

        const nodeEl        = document.createElement('div');
        nodeEl.textContent  = node.text;
        nodeEl.style.color  = node.color;
        nodeEl.className    = 'node-label';
        var textElement = new CSS3DObject(nodeEl);
        textElement.scale.set(0.02, 0.02, 0.02)
        // textElement.position.z += 2
        // const textElement   = new CSS3DObject(nodeEl)

        objectLOD.addLevel(plane, 100)
        objectLOD.addLevel(cube, 99)
        group.add(objectLOD)

        textLOD.addLevel(new THREE.Object3D(), 600)
        textLOD.addLevel(textElement, 500)

        group.add(textLOD)

        return group;
      })
    },
    overrideCameraSettings() {
      this.Graph.camera().far = 1200
      this.Graph.camera().updateProjectionMatrix()
    },
    instantiateGUI() {
      var gui = new GUI();

      gui.add( this.Graph.camera().position , 'x', -500, 500 ).step(5)
      gui.add( this.Graph.camera().position , 'y', -500, 500 ).step(5)
      gui.add( this.Graph.camera().position , 'z', -500, 500 ).step(5)
    },
    requestVRPermissions () {
      DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          window.addEventListener('deviceorientation', () => {
            // do something with e
          })
        }
      })
      .catch(console.error)

      DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          window.addEventListener('devicemotion', () => {
            // do something with e
          })
        }
      })
      .catch(console.error)
    }
  },
  created () {
    GLTFImporter("95k.glb").then((result) => {
      this.object = result
      this.addModelsToScene()
    })
  },
  async mounted () {
    var graph = ForceGraph3D({
      extraRenderers: [ new CSS3DRenderer() ],
      rendererConfig: {
        antialias: false,
        gammaOutput: true,
        // depth: false // causes glitches on winx64
        // powerPreference: "high-performance",
        // precision: "lowp"
      },
      controlType: "orbit"
    });

    // const sphereGeometryFar = new THREE.SphereBufferGeometry( 1, 5, 3 );
    // const sphereGeometryNear = new THREE.SphereBufferGeometry( 1, 20, 15 );
    

    // Declare Graph to be later used for Click handling
    this.Graph = graph(this.$el)
        .graphData(NetworkData)
        .nodeAutoColorBy('text')
        .enableNodeDrag(false)
        // .nodeLabel(node => `${node.text}`)
        .nodeVisibility(true)
        .linkResolution(0)
        .cooldownTicks(0)
        .warmupTicks(60)
        .nodeThreeObjectExtend(false)
        .onNodeClick(node => {
          // Aim at node from outside it
          const distance = 5;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

          // Set last clicked node
          this.LAST_CLICKED_NODE = node.id

          this.Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({ x, y, z })
            10000  // ms transition duration
          )
        })
        .onLinkClick(link => {
          let linkTarget;
          if(link.target.id == this.LAST_CLICKED_NODE) {
            linkTarget = link.source
          } else {
            linkTarget = link.target
          } 

          self.LAST_CLICKED_NODE = linkTarget.id
          // console.log(linkTarget)

          const distance = 5;
          const distRatio = 1 + distance / Math.hypot(linkTarget.x, linkTarget.y, linkTarget.z);

          this.Graph.cameraPosition(
            { x: linkTarget.x * distRatio, y: linkTarget.y * distRatio, z: linkTarget.z * distRatio }, // new position
            linkTarget, // lookAt ({ x, y, z })
            10000  // ms transition duration
          )
          // console.log(link)
        })
        .onEngineStop(() => {
          this.overrideCameraSettings()
          this.Graph.renderer().xr.enabled = true;
          console.log("Engine has stopped calculating.")
        })

        this.plane = new THREE.Mesh( this.planeGemetry, this.planeMaterial );
        
        const light = new THREE.AmbientLight( 0x404040, 0.1); // soft white light
        this.Graph.scene().add( light );

        this.Graph.scene().fog = new THREE.Fog(0x000000, 1100, 1250);
        this.Graph.scene().background = new THREE.Color( 0x082032 );

        // console.log(VRButton)
        this.$el.appendChild( VRButton.createButton( this.Graph.renderer() ) );

        this.instantiateGUI()
        this.requestVRPermissions()
        this.animate()

        console.log(this.Graph.renderer())
    }
}
</script>

<style>
html,body {
  margin: 0;
  padding: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.node-label {
  position: absolute;
  top: 1px;
  font-family: 'Inter';
  position: absolute;
  font-size: 18px;
  padding: .25rem .45rem;
  border-radius: 12px;
  background-color: rgba(1,1,1,0.5);
  user-select: none;
}
</style>
