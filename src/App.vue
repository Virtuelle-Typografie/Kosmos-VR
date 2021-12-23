<template>
  <div></div>
</template>

<script>

import ForceGraph3D from '3d-force-graph';
import NetworkData from './data/network-relations.json'

import * as THREE from 'three'
// IMPORTANT TO IMPORT FROM JSM FILESET
const {CSS2DRenderer, CSS2DObject} = require('three/examples/jsm/renderers/CSS2DRenderer') 

export default {
  name: 'App',
  data() {
    return  {
      LAST_CLICKED_NODE : String
    }
  },
  components: {
    
  },
  mounted () {
    console.log(THREE)
    console.log(CSS2DRenderer)

    var graph = ForceGraph3D({
      extraRenderers: [ new CSS2DRenderer() ]
    });

    // Declare Graph to be later used for Click handling
    const Graph = graph(this.$el)
        .graphData(NetworkData)
        .nodeAutoColorBy('text')
        .enableNodeDrag(false)
        .nodeLabel(node => `${node.text}`)
        .nodeResolution(0)
        .nodeVisibility(true)
        .linkResolution(0)
        .nodeThreeObject(node => {
          const nodeEl = document.createElement('div');
          nodeEl.textContent = node.text;
          nodeEl.style.color = node.color;
          nodeEl.className = 'node-label';
          return new CSS2DObject(nodeEl);
        })
        .nodeThreeObjectExtend(true)
        .onNodeClick(node => {
          // Aim at node from outside it
          const distance = 40;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

          // Set last clicked node
          this.LAST_CLICKED_NODE = node.id

          Graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({ x, y, z })
            3000  // ms transition duration
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
          console.log(linkTarget)

          const distance = 40;
          const distRatio = 1 + distance/Math.hypot(linkTarget.x, linkTarget.y, linkTarget.z);

          Graph.cameraPosition(
            { x: linkTarget.x * distRatio, y: linkTarget.y * distRatio, z: linkTarget.z * distRatio }, // new position
            linkTarget, // lookAt ({ x, y, z })
            3000  // ms transition duration
          )

          console.log(link)
        })
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
      font-size: 7px;
      padding: 1px 4px;
      border-radius: 4px;
      background-color: rgba(0,0,0,0.5);
      user-select: none;
    }
</style>
