<template>
  <div></div>
</template>

<script>

// Import notes: in this webpack environment it's important to import three submodules
// from the /jsm/ subfolder

import ForceGraph3D from '3d-force-graph';
import NetworkData from '../data/network-relations.json'

import GLTFImporter from '../utils/GLTFImporter'

// import { fogParsVert, fogVert, fogParsFrag, fogFrag } from "./shader/FogReplace";

import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js';

import SpriteText from 'three-spritetext';

import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export default {
  name: 'Network',
  data() {
    return  {
      Graph : undefined,
      LAST_CLICKED_NODE : String,
      object : [],
      initial : true,
      THREE: {
        scene: Object,
        camera: Object,
      },
      dolly: new THREE.Group(),
      nodes : [],
      textNodes : [],

      objectLOD : new THREE.LOD(),
      textLOD : new THREE.LOD(),

      objectStore : {
        plane : new THREE.Mesh()
      },
      
      stats : Stats(),
      geometryStore: {
        empty : new THREE.Object3D(),
        planeGeometry : new THREE.PlaneGeometry( 1, 1 ),
        lineGeometry: new THREE.BufferGeometry(),
        linePoint: new THREE.Vector3(),
      },
      materialStore: {
        planeMaterial : new THREE.ShaderMaterial({
          vertexShader: this.vertexShader(),
          fragmentShader: this.fragmentShader(),
        }),
        lineMaterial: new THREE.LineBasicMaterial({color: 0x5c6e8a}),
      },
      renderSettings: {
        renderPixelRatio: 1,
        renderDistance : 350,
      },
      // VR-Controllers
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
    
      this.Graph.renderer().setAnimationLoop( this.render );
    },
    // Gets called every frame
		render () {
      // When the XR Scene is triggered
      if(this.Graph.renderer().xr.isPresenting) {
        if(this.initial) {
            this.initialCameraMovement()
            this.initializeAudio()
            this.initial = false
        }
        // Create VR Scene
        this.Graph.renderer().render( this.Graph.scene(), this.Graph.camera());
      }
      
      this.stats.update()
      this.renderTween()
		},
    renderTween () {
      window.requestAnimationFrame(this.renderTween);
      TWEEN.update();
    },
    addModelsToScene () {
      this.Graph.nodeThreeObject((node) => {     
        const index = Math.floor( Math.random() * Object.keys(this.object).length);

        const cubeRef = this.object[Object.keys(this.object)[index]]

        const cube =  cubeRef.clone()
        const plane = new THREE.Mesh(this.geometryStore.planeGeometry, this.materialStore.planeMaterial)
        const empty = this.geometryStore.empty.clone()

        const material = cubeRef.material.clone()
        cube.material = material


        empty.matrixAutoUpdate = false

        const group = new THREE.Group()
        const color = new THREE.Color(0xffffff)

        cube.material.color = color
        cube.material.metalness = 0.01;
        cube.scale.set(0.4, 0.4, 0.4)
        cube.position.set(0,2.5,-10)
        cube.matrixAutoUpdate = false
    
        cube.position.set(0,0.5,0)

        const objectLOD = new THREE.LOD()
        const textLOD   = new THREE.LOD()

        const textElement = new SpriteText(node.text);
        textElement.fontSize = 140
        textElement.fontFace = "FranziskaPro"
        textElement.fontWeight = 500
        textElement.fontStyle = 'italic'

        const textSize = {
          x: textElement.scale.x / 2,
          y: textElement.scale.y / 2,
          z: textElement.scale.z / 2
        }
        textElement.scale.set(textSize.x, textSize.y, textSize.z)
        textElement.name = "textElement"

        this.textNodes.push(textElement)

        textLOD.addLevel(empty, this.renderSettings.renderDistance * 1.1)
        textLOD.addLevel(textElement, this.renderSettings.renderDistance)
        group.add(textLOD)

        objectLOD.position.set(0, -4, 0)
        objectLOD.addLevel(plane, 100)
        objectLOD.addLevel(cube, 99)
        group.add(objectLOD)

        group.name = 'NODE'

        return group;
      })
    },
    vertexShader () {
      return `
          void main() {
            gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, position.z, 1.0) + vec4(position.x, position.y, 0.0, 0.0));
        }
        `
    },
    fragmentShader () {
      return `
          void main() {
            vec3 color;
            gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
        }
        `
    },
    addLinksToScene() {
      this.Graph.linkThreeObject((node) => {
        const lineGeometry  = this.geometryStore.lineGeometry.clone()
        const startPoint    = this.geometryStore.linePoint.clone()
        const endPoint      = this.geometryStore.linePoint.clone()
        const lineMaterial  = this.materialStore.lineMaterial.clone()

        const points = [];

        points.push(startPoint.set(  {x: node.source.x, y: node.source.y, z: node.source.z }  ))
        points.push(endPoint.set(    {x: node.target.x, y: node.target.y, z: node.target.z }  ))

        const geometry = lineGeometry.setFromPoints(points)

        const line = new THREE.Line( geometry, lineMaterial );
        line.matrixAutoUpdate = false

        return line
      })
    },
    overrideCameraSettings() {
      this.Graph.camera().position.set(0,0,1000)
      this.Graph.camera().far = this.renderSettings.renderDistance
      this.Graph.camera().updateProjectionMatrix()
    },
    overrideSceneSettings() {
      // Adds all scene related objects
      const light = new THREE.AmbientLight( 0x404040, 0.1); // soft white light
      this.Graph.scene().add( light );
      this.Graph.scene().background = new THREE.Color( 0x000000 );
      this.Graph.scene().fog = new THREE.Fog(0x000000, this.renderSettings.renderDistance - 150, this.renderSettings.renderDistance + 50);

      // Adding Dolly to the scene — this is mandatory to get the camera moving in VR space
      this.dolly.add(this.Graph.camera())
      this.Graph.scene().add(this.dolly)
    },
    overrideRendererSettings() {
      this.Graph.renderer().xr.enabled = true;
    },
    instantiateGUI() {
      var gui = new GUI();

      var renderSettings = gui.addFolder('Render Settings');
      
      renderSettings.add( this.renderSettings , 'renderPixelRatio', 1, 4 )
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
      const distance = 15;
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
      let cameras = []
      this.Graph.scene().traverse((node) => {
        if(node.name == 'NODE') {
          nodesList.push(node)
        }

        if(node.fov) {
          console.log("Camera Found")
          cameras.push(node)
        }

        if(node.isMesh) {
          node.matrixAutoUpdate = false
        }
      })


      this.nodes = nodesList
    },
    onSelectStart(event) {
      // This function is triggered if the trigger button on the VR controller is pressed
      console.log("Button is Pressed")
      
      const controller = event.target;

      // returns an array of intersecting objects after pressing the trigger
      const intersections = this.getIntersections( controller );

      if ( intersections.length > 0 ) {
					const intersection = intersections[ 0 ];
					const object = intersection.object;

          let target
          let targetVector = new THREE.Vector3()

          intersections.forEach((intersection) => {
            // sets the target to be always the parent element named 'NODE'
            // this is important to always have the same coordinates for the camera rail
            if(intersection.object.parent.isLOD) {
              target = intersection.object.parent
            }
          }) 

          // Get absolute Position of selected "NODE" object
          targetVector = target.getWorldPosition(targetVector)

          const distance = 20;
          const distRatio = 1 + distance/Math.hypot(targetVector.x, targetVector.y, targetVector.z);

          this.VRCameraRail(
            { x: targetVector.x * distRatio, y: targetVector.y * distRatio, z: targetVector.z * distRatio },
            { x: targetVector.x, y: targetVector.y, z: targetVector.z },
            10000,
          )

					// object.material.color.set(0x00FF00)

					// controller.attach( object );

					controller.userData.selected = object;
				}

    },
    onSelectEnd(){

    },
    getIntersections(controller) {
      this.raycaster.camera = this.Graph.camera()
      this.tempMatrix.identity().extractRotation( controller.matrixWorld );

      this.raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
      this.raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( this.tempMatrix );

      console.log("Objects to intersect against:", this.nodes)

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


      // Only for stationary space

      // new TWEEN.Tween(camLookAt)
      //     .to(finalLookAt, transitionDuration)
      //     .easing(TWEEN.Easing.Cubic.In)
      //     .delay(9000)
      //     .onUpdate(() => {
      //         var mx = new THREE.Matrix4().lookAt(camLookAt,new THREE.Vector3(0,0,0),new THREE.Vector3(0,1,0));
      //         var qt = new THREE.Quaternion().setFromRotationMatrix(mx);

      //         this.dolly.quaternion.x = qt.x
      //         this.dolly.quaternion.y = qt.y
      //         this.dolly.quaternion.z = qt.z   
      //         this.dolly.quaternion.w = qt.w

      //     }).start(); // Face direction in 1/3rd of time

      },
      initialCameraMovement () {
          this.dolly.position.set(0,0,2000)

          let target = this.nodes[0]
          console.log("Camera Target: ", target)
          let targetVector = new THREE.Vector3()
          // Get absolute Position of selected "NODE" object
          targetVector = target.getWorldPosition(targetVector)

          const distance = 20;
          const distRatio = 1 + distance/Math.hypot(targetVector.x, targetVector.y, targetVector.z);

          this.VRCameraRail(
            { x: targetVector.x * distRatio, y: targetVector.y * distRatio, z: targetVector.z * distRatio },
            { x: targetVector.x, y: targetVector.y, z: targetVector.z },
            20000,
          )
      },
      initializeAudio() {
        const listener = new THREE.AudioListener();
        this.Graph.camera().add(listener)

        // create a global audio source
        const sound = new THREE.Audio( listener );

        // load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( '/assets/audio/interstellar.ogg', function( buffer ) {
          sound.setBuffer( buffer );
          sound.setLoop( true );
          sound.setVolume( 0.2 );
          sound.play();
        });

        console.log("Audio started")
      }
  },
  created () {
    GLTFImporter(["anker1.glb", "anker2.glb", "anker3.glb", "anker4.glb"]).then((results) => {
      console.log(results)

      this.object = results
      this.addModelsToScene()
      this.addLinksToScene()
    })
  },
  async mounted () {
    var graph = ForceGraph3D({
      // extraRenderers: [ new CSS3DRenderer() ],
      rendererConfig: {
        antialias: false,
        gammaOutput: true,
        // depth: false // causes glitches on winx64
        powerPreference: "high-performance",
        precision: "lowp",
        alpha: false,
      },
      controlType: this.state.VREnabled ? "fly" : "orbit"
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
        .linkThreeObjectExtend(false)
        .onNodeClick(node => {
          // Set last clicked node
          this.LAST_CLICKED_NODE = node.id
          this.startCameraRail(node.x, node.y, node.z)
        })
        .onEngineStop(() => {
          // saves every node into an array to be accessed later
          this.generateNodesArray()

          this.overrideCameraSettings()
          this.overrideSceneSettings()
          this.overrideRendererSettings()

          console.log("Engine has stopped calculating.")
        })

        
        // Displays the VR Button for instanciating the VR Session
        this.$el.appendChild( VRButton.createButton( this.Graph.renderer() ) );
        
        // Adds the Stats Window to the DOM
        document.body.appendChild(this.stats.dom)

        // Defines the values displayed in the gui
        this.instantiateGUI()

        // Starts the rendering loop
        this.animate()
    }
}
</script>

<style lang="scss">
@import '../scss/typography.scss';

html,body {
  margin: 0;
  padding: 0;
}
#app {
  font-family: 'FranziskaPro';
  font-weight: bold;
  font-style: italic;
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
