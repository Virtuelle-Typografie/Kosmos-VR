<template>
  <div></div>
</template>

<script>

import ForceGraph3D from '3d-force-graph';
import NetworkData from './data/network-relations.json'

import GLTFImporter from './utils/GLTFImporter'

// import { fogParsVert, fogVert, fogParsFrag, fogFrag } from "./shader/FogReplace";

import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js';
// IMPORTANT TO IMPORT FROM JSM FILESET
const {CSS3DRenderer, CSS3DObject} = require('three/examples/jsm/renderers/CSS3DRenderer')

import Stats from 'three/examples/jsm/libs/stats.module'

// import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";

import { GUI } from 'dat.gui'

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export default {
  name: 'App',
  data() {
    return  {
      LAST_CLICKED_NODE : String,
      Graph : undefined,
      object : undefined,
      scene: Object,
      dolly: new THREE.Group(),
      planeGemetry : new THREE.PlaneBufferGeometry( 2, 2 ),
      planeMaterial : new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide }),
      plane : new THREE.Object3D(),
      objectLOD : new THREE.LOD(),
      textLOD : new THREE.LOD(),
      renderPixelRatio: 1,
      renderDistance : 450,
      nodes : [],
      empty : new THREE.Object3D(),
      stats : Stats(),
      controller: {
        left: Object,
        right: Object,
        controls: Object
      },
      raycaster: new THREE.Raycaster(),
      tempMatrix: new THREE.Matrix4(),
      state: {
        VREnabled : false
      }
    }
  },
  methods: {
    animate () {
      console.log("Animate")
      this.instantiateControllers()

      // Adding Dolly to the scene — this is mandatory to get the camera moving in VR space
      // this.Graph.scene().add(this.dolly)
      // this.dolly.add(this.Graph.camera())
    
      this.Graph.renderer().setAnimationLoop( this.render );
    },
    // Gets called every frame
		render () {
      // When the XR Scene is triggered
      if(this.Graph.renderer().xr.isPresenting) {
        console.log("VR Mode started")
        // Create VR Scene
        this.Graph.renderer().render( this.Graph.scene(), this.Graph.camera());
      }
      
      this.stats.update()
      this.renderTween()
      // plane.quaternion.copy(camera.quaternion);
		},
    renderTween () {
      window.requestAnimationFrame(this.renderTween);
      TWEEN.update();
    },
    addModelsToScene () {
      this.Graph.nodeThreeObject((node) => {     
        const cube =  this.object.clone()
        const plane = this.plane.clone()
        const empty = this.empty.clone()

        const material = this.object.material.clone()
        cube.material = material
        plane.material = material

        plane.matrixAutoUpdate = false
        empty.matrixAutoUpdate = false

        const group = new THREE.Group()

        const color = cube.material.color.clone()
        color.setStyle(node.color)

        cube.material.color = color
        cube.material.metalness = 0.5;
        cube.position.set(0,2.5,0)
        cube.scale.set(0.4, 0.4, 0.4)
        cube.matrixAutoUpdate = false
    
        plane.material.color = color
        cube.position.set(0,0.5,0)

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

        objectLOD.addLevel(empty, this.renderDistance * 0.95)
        objectLOD.addLevel(plane, 100)
        objectLOD.addLevel(cube, 99)
        group.add(objectLOD)

        textLOD.addLevel(empty, this.renderDistance * 0.66)
        textLOD.addLevel(textElement, this.renderDistance * 0.6)
        group.add(textLOD)

        group.name = 'NODE'

        return group;
      })
    },
    overrideCameraSettings() {
      this.Graph.camera().far = this.renderDistance
      this.Graph.camera().updateProjectionMatrix()
    },
    instantiateGUI() {
      var gui = new GUI();

      var renderSettings = gui.addFolder('Render Settings');
      
      renderSettings.add( this , 'renderPixelRatio', 1, 4 )
        .step(1)
        .onChange((value) => {
          this.Graph.renderer().setPixelRatio(value)
      });
      
      var cameraSettings = gui.addFolder('Camera Settings');
      cameraSettings.add( this.Graph.camera().position , 'x', -500, 500 ).step(5)
      cameraSettings.add( this.Graph.camera().position , 'y', -500, 500 ).step(5)
      cameraSettings.add( this.Graph.camera().position , 'z', -500, 500 ).step(5)


    },
    instantiateControllers () {
      if (this.state.VREnabled && !this.Graph.renderer().xr.isPresenting) {
        return;
      }

      var controllerModelFactory = new XRControllerModelFactory();

      this.controller.left  = this.Graph.renderer().xr.getController( 0 )
      this.controller.right = this.Graph.renderer().xr.getController( 1 )

      // Add Eventlisteners for each Controller
      this.controller.left.addEventListener('selectstart',  this.onSelectStart );
      this.controller.right.addEventListener('selectstart', this.onSelectStart );

      // get the grip space of the first controller
      const controllerGripLeft = this.Graph.renderer().xr.getControllerGrip(0);
      const modelLeft = controllerModelFactory.createControllerModel( controllerGripLeft );

      const controllerGripRight = this.Graph.renderer().xr.getControllerGrip(1)
      const modelRight = controllerModelFactory.createControllerModel(controllerGripRight)

      controllerGripLeft.add( modelLeft )
      controllerGripRight.add(modelRight)

      const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
      const line = new THREE.Line( geometry );
      line.name = 'line';
			line.scale.z = 500;

      // Adds Lines in front of the controllers to navigate
      this.controller.left.add(line.clone())
      this.controller.right.add(line.clone())
      
      this.raycaster = new THREE.Raycaster()

      // Adds controller to the dolly so that the controllers will be moved with the camera assigned to it
      this.dolly.add(controllerGripLeft)
      this.dolly.add(controllerGripRight)
      this.dolly.add(this.controller.left)
      this.dolly.add(this.controller.right)

      // Set the global VR State
      this.state.VREnabled = true
    },
    startCameraRail(x, y, z) {
      // Aim at node from outside it
      const distance = 5;
      const distRatio = 1 + distance/Math.hypot(x, y, z);

      console.log("Start Camera Rail to: ", { x: x, y: y, z: z})

      this.Graph.cameraPosition(
        { x: x * distRatio, y: y * distRatio, z: z * distRatio }, // new position
        { x, y, z }, // lookAt ({ x, y, z })
        10000  // ms transition duration
      )
    },
    generateNodesArray() {
      let nodesList = []
      this.Graph.scene().traverse((node) => {
        if(node.name == 'NODE') {
          nodesList.push(node)
        }
      })

      this.nodes = nodesList
    },
    onSelectStart(event) {
      console.log("Button is Pressed")
      // this.Graph.scene().background = new THREE.Color( 0x082032 );
      
      const controller = event.target;

      const intersections = this.getIntersections( controller );

      if ( intersections.length > 0 ) {
					const intersection = intersections[ 0 ];
					const object = intersection.object;

          let target
          let targetVector = new THREE.Vector3()

          intersections.forEach((intersection) => {
            if(intersection.object.parent.isLOD) {
              target = intersection.object.parent
            }
          }) 

          // Get absolute Position of selected "NODE" object
          targetVector = target.getWorldPosition(targetVector)

          const distance = 15;
          const distRatio = 1 + distance/Math.hypot(targetVector.x, targetVector.y, targetVector.z);

          this.VRCameraRail(
            { x: targetVector.x * distRatio, y: targetVector.y * distRatio, z: targetVector.z * distRatio },
            { x: targetVector.x, y: targetVector.y, z: targetVector.z },
            10000,
          )

					object.material.color.set(0x00FF00)

					// controller.attach( object );

					controller.userData.selected = object;
				}

    },
    onSelectEnd(){

    },
    getIntersections(controller) {
      this.tempMatrix.identity().extractRotation( controller.matrixWorld );

      this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
      this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.tempMatrix );

      return this.raycaster.intersectObjects( this.nodes, true );
    },
    VRCameraRail (position, lookAt, transitionDuration) {
      var finalPos = position;
      var finalLookAt = lookAt || {
          x: 0,
          y: 0,
          z: 0
      };
      var vector = new THREE.Vector3(); 

      var camPos = Object.assign({}, this.dolly.position);
      var camLookAt = this.dolly.getWorldDirection(vector)

      camLookAt = { x: camLookAt.x, y: camLookAt.y, z: camLookAt.z }

      console.log("campos: ", camPos)
      console.log("finalpos: ", finalPos)
      console.log("finallookat: ", finalLookAt)
      console.log("camlookat: ", camLookAt)

      this.dolly.position.x = finalPos.x
      this.dolly.position.y = finalPos.y
      this.dolly.position.z = finalPos.z

      new TWEEN.Tween(camPos)
          .to(finalPos, transitionDuration)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(() => {
              this.dolly.position.x = camPos.x
              this.dolly.position.y = camPos.y
              this.dolly.position.z = camPos.z
          }).start(); // Face direction in 1/3rd of time


      new TWEEN.Tween(camLookAt)
          .to(finalLookAt, transitionDuration)
          .easing(TWEEN.Easing.Circular.In)
          .delay(5000)
          .onUpdate(() => {
              var mx = new THREE.Matrix4().lookAt(camLookAt,new THREE.Vector3(0,0,0),new THREE.Vector3(0,1,0));
              var qt = new THREE.Quaternion().setFromRotationMatrix(mx);

              this.dolly.quaternion.x = qt.x
              this.dolly.quaternion.y = qt.y
              this.dolly.quaternion.z = qt.z   
              this.dolly.quaternion.w = qt.w

          }).start(); // Face direction in 1/3rd of time

      }
  },
  created () {
    GLTFImporter("anker.glb").then((result) => {
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
        powerPreference: "high-performance",
        precision: "lowp",
        alpha: false,
      },
      controlType: "fly"
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
          // Set last clicked node
          this.LAST_CLICKED_NODE = node.id
          this.startCameraRail(node.x, node.y, node.z)
        })
        .onEngineStop(() => {
          this.overrideCameraSettings()
          this.generateNodesArray()
          this.Graph.renderer().xr.enabled = true;
          console.log("Engine has stopped calculating.")
        })

        this.plane = new THREE.Mesh( this.planeGemetry, this.planeMaterial );
        
        const light = new THREE.AmbientLight( 0x404040, 0.1); // soft white light
        this.Graph.scene().add( light );

        this.Graph.scene().fog = new THREE.Fog(0x000000, this.renderDistance - 150, this.renderDistance + 50);
        

        this.$el.appendChild( VRButton.createButton( this.Graph.renderer() ) );
        
        document.body.appendChild(this.stats.dom)

        this.instantiateGUI()
        this.animate()
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
  top: 0;
  font-family: 'Inter';
  position: absolute;
  font-size: 18px;
  padding: .25rem .45rem;
  border-radius: 12px;
  background-color: rgba(1,1,1,0.5);
  user-select: none;
}
</style>
