<template>
  <div>Test</div>
</template>

<script>

import ForceGraph3D from '3d-force-graph';
import NetworkData from './data/network-relations.json'

export default {
  name: 'App',
  components: {
  
  },
  mounted () {
    // Import THREEJS Scripts
    let threeScript = document.createElement('script')
    threeScript.setAttribute('src', '//unpkg.com/three')
    document.head.appendChild(threeScript)

    let rendererScript = document.createElement('script')
    rendererScript.setAttribute('src', '//unpkg.com/three/examples/js/renderers/CSS2DRenderer.js')
    document.head.appendChild(rendererScript)


    var graph = ForceGraph3D({
      
    });
    graph(this.$el)
        .graphData(NetworkData)
        .nodeAutoColorBy('text')
        .nodeLabel(node => `${node.text}`)
        .nodeThreeObjectExtend(true)
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
      font-size: 12px
;
      padding: 1px 4px;
      border-radius: 4px;
      background-color: rgba(0,0,0,0.5);
      user-select: none;
    }
</style>
