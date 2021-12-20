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
    var graph = ForceGraph3D();
    graph(this.$el)
        .graphData(NetworkData)
        .nodeAutoColorBy('user')
        .nodeLabel(node => `${node.text}`)
        .onNodeClick(node => window.open(`https://bl.ocks.org/${node.user}/${node.id}`, '_blank'));
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
</style>
