<template>
  <div></div>
</template>

<script>

import ForceGraph3D from '3d-force-graph';
import NetworkData from './data/network-relations.json'

import GLTFImporter from './utils/GLTFImporter'

import * as THREE from 'three'
// IMPORTANT TO IMPORT FROM JSM FILESET
const {CSS2DRenderer/*, CSS2DObject*/} = require('three/examples/jsm/renderers/CSS2DRenderer') 
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

export default {
  name: 'App',
  data() {
    return  {
      LAST_CLICKED_NODE : String,
      Graph: undefined,
      object : undefined
    }
  },
  methods: {
    addModelsToScene () {
      this.Graph.nodeThreeObject(() => {       
        const cube = this.object.clone()

        const group = new THREE.Group()

        // cube.material.color.setHex(node.color)
        // const objectLOD = new THREE.LOD()
        // objectLOD.addLevel(this.object, 750)
        group.add(cube)

        return group;
      })
    }
  },
  created () {
    GLTFImporter("cube.gltf").then((result) => {
      this.object = result
      this.addModelsToScene()
    })
  },
  async mounted () {
    var graph = ForceGraph3D({
      extraRenderers: [ new CSS2DRenderer() ],
      rendererConfig: {
        antialias: false,
        // depth: false,
        // powerPreference: "high-performance",
        // precision: "lowp"
      },
      controlType: "trackball"
    });
  

    // const sphereGeometryFar = new THREE.SphereBufferGeometry( 1, 5, 3 );
    // const sphereGeometryNear = new THREE.SphereBufferGeometry( 1, 20, 15 );
    // const planeGeometry = new THREE.PlaneBufferGeometry( 2, 2 );

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
        // .nodeThreeObject(node => {
        //   const group = new THREE.Group()
        //   const textLOD = new THREE.LOD()
        //   const objectLOD = new THREE.LOD()

        //   // Check for root node, to display this in a different shape
        
        //   const nodeEl = document.createElement('div');
        //   nodeEl.textContent = node.text;
        //   nodeEl.style.color = node.color;
        //   nodeEl.className = 'node-label';
        //   const textElement = new CSS2DObject(nodeEl)

        //   textLOD.addLevel(textElement, 200)
        //   textLOD.addLevel(new THREE.Object3D, 500)

        //   const sphereMaterial = new THREE.MeshBasicMaterial( {color: node.color } );
        //   const planeMaterial = new THREE.MeshBasicMaterial( { color: node.color, side: THREE.DoubleSide } );

        //   const sphereFar = new THREE.Mesh( sphereGeometryFar, sphereMaterial );
        //   // const sphereNear = new THREE.Mesh( sphereGeometryNear, sphereMaterial )
        //   const plane = new THREE.Mesh( planeGeometry, planeMaterial );
        //   // plane.quaternion.copy(Graph.camera().quaternion);

        //   objectLOD.addLevel(new THREE.Object3D, 750)
        //   objectLOD.addLevel(plane, 100)
        //   objectLOD.addLevel(sphereFar, 75)

        //   group.add(textLOD)
        //   group.add(objectLOD)

        //   return group;
        // })
        .nodeThreeObjectExtend(false)
        .onNodeClick(node => {
          // Aim at node from outside it
          const distance = 10;
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

          const distance = 10;
          const distRatio = 1 + distance / Math.hypot(linkTarget.x, linkTarget.y, linkTarget.z);

          this.Graph.cameraPosition(
            { x: linkTarget.x * distRatio, y: linkTarget.y * distRatio, z: linkTarget.z * distRatio }, // new position
            linkTarget, // lookAt ({ x, y, z })
            10000  // ms transition duration
          )
          // console.log(link)
        })
        .onEngineStop(() => {
          console.log("Engine has stopped calculating.")

          this.Graph.scene.frustumCulled = false
        })
        
        

        this.Graph.scene().fog = new THREE.Fog(0x000000, 100, 6000);

        // console.log(VRButton)
        this.$el.appendChild( VRButton.createButton( this.Graph.renderer() ) );
        this.Graph.renderer().xr.enabled = true;
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
  font-family: 'Inter';
  position: absolute;
  font-size: 11px;
  padding: .25rem .45rem;
  border-radius: 12px;
  background-color: rgba(0,0,0,0.5);
  user-select: none;
}
</style>
