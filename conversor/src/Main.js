import * as THREE from 'three/webgpu';
import { screenUV, color, vec2, vec4, reflector, positionWorld } from 'three/tsl';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { TBALoader } from '../../src/TBALoader.js';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

import * as msgpack from '@msgpack/msgpack';
import * as fflate from 'fflate';

import Panel from './Panel.js';
import Player from './Player.js';
import Code from './Code.js';

const VERSION = '0.1.0';

function getSource( sourceModel ) {

	const clip = sourceModel.animations[ 0 ];

	const helper = new THREE.SkeletonHelper( sourceModel );
	const skeleton = new THREE.Skeleton( helper.bones );

	const mixer = new THREE.AnimationMixer( sourceModel );
	mixer.clipAction( sourceModel.animations[ 0 ] ).play();

	return { clip, skeleton, mixer };

}

export default class Main {

	constructor() {

		this.panel = new Panel();
		this.player = new Player();
		this.code = new Code();

		this.panel.addEventListener( 'download', ( e ) => {
			this.download();
		} );

		this.panel.addEventListener( 'change', ( e ) => {
			this.rebuild();
		} );

		this.panel.addEventListener( 'view', ( e ) => {
			if ( this.panel.view === '3d' ) {
				this.code.hide();
			} else if ( this.panel.view === 'code' ) {
				this.code.show();
			}
		} );

		this.panel.addEventListener( 'drop', ( e ) => {

			const { extension } = e.detail;

			if ( extension === 'fbx' ) {

				this.buildFromFBX( e.detail.data );

			} else if ( extension === 'glb' ) {

				this.loadModel( e.detail.data );

			} else if ( extension === 'tba' ) {

				this.loadAnimation( e.detail.data );

			} else {

				alert( 'Please upload an FBX (animation), GLB (model), or TBA (animation) file.' );

			}

		} );

		this.setup();
		this.setupBackground();
		this.setupLights();
		this.setupReflector();
		this.setupModels();

		//this.testTBA();

	}

	async loadModel( data ) {

		const loader = new GLTFLoader();

		let gltf;

		if ( data instanceof ArrayBuffer ) {

			gltf = await loader.parseAsync( data );

		} else if ( typeof data === 'string' ) {

			gltf = await loader.loadAsync( data );

		}

		if ( this.model ) this.scene.remove(this.model);

		const model = gltf.scene;

		this.model = model;
		this.scene.add( model );

		if ( this.animation ) {

			this.rebuild();

		}

	}

	getOptions() {

		const decoder = this.panel.settings.decoder;

		const hipInfluence = new THREE.Vector3(
			decoder.hipInfluence.x ? 1 : 0,
			decoder.hipInfluence.y ? 1 : 0,
			decoder.hipInfluence.z ? 1 : 0
		);

		const scale = .01;

		return {
			retarget: {
				hip: 'mixamorigHips',
				scale,
				hipInfluence,
				getBoneName: function ( bone ) {

					return 'mixamorig' + bone.name;

				}
			}
		};

	}

	async loadAnimation( data ) {

		// TBA Animation

		const target = this.model.children[ 0 ].children[ 1 ];

		let arrayBuffer;

		if ( data instanceof ArrayBuffer ) {

			arrayBuffer = data;

		} else if ( typeof data === 'string' ) {

			const response = await fetch( data );
			arrayBuffer = await response.arrayBuffer();

		}

		let bytes = new Uint8Array( arrayBuffer );
		bytes = fflate.decompressSync( bytes );
		const finalTBA = msgpack.decode( bytes );

		const clip = THREE.AnimationClip.parse( finalTBA.clip );
		clip.name = finalTBA.clip.name;

		//

		const mixer = new THREE.AnimationMixer( target );
		mixer.clipAction( clip ).play();

		//

		this.clip = clip;
		this.mixer = mixer;

		//

		this.player.setAnimation( mixer, clip );
		this.player.stop();
		this.player.play();

	}

	async buildFromFBX( data, options = this.getOptions() ) {

		const loader = new FBXLoader();

		let fbx;

		if ( data instanceof ArrayBuffer ) {

			fbx = await loader.parse( data );

		} else if ( typeof data === 'string' ) {

			fbx = await loader.loadAsync( data );

		}

		const animation = getSource( fbx );

		this.build( animation, options );

	}

	rebuild( options = this.getOptions() ) {

		this.build( this.animation, options );

	}

	build( animation, options ) {

		this.animation = animation;

		const target = this.model.children[ 0 ].children[ 1 ];

		const retargetedClip = SkeletonUtils.retargetClip( target, animation.skeleton, animation.clip, options.retarget );
		retargetedClip.name = this.panel.settings.decoder.name || retargetedClip.name || 'retargetedClip';

		const tba = {
			version: VERSION,
			clip: retargetedClip.toJSON(),
		};

		let bytes = msgpack.encode( tba );
		bytes = fflate.zlibSync( bytes, { level: 9 } );

		this.panel.setFileSize( bytes.length );

		//

		const tbaBytes = new TextEncoder().encode( JSON.stringify( tba ) );
		const ratio = ( bytes.length / tbaBytes.length ) * 100;

		this.panel.setCompressionRatio( ratio );

		//

		this.file = bytes;

		// Test the file

		const time = performance.now();

		this.loadAnimation( bytes.buffer );

		const benchTime = performance.now() - time;

		this.panel.setBenchTime( benchTime );

	}

	async setupModels() {

		await this.loadModel( './assets/jean.glb' );
		await this.buildFromFBX( './assets/walk.fbx' );

	}

	resize() {

		const container = document.getElementById( 'canvas3d-container' );

		const width = container.clientWidth;
		const height = container.clientHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height, false);

	}

	download() {

		if ( ! this.file ) return;

		this.rebuild();

		const blob = new Blob( [ this.file ], { type: 'application/octet-stream' } );
		const url = URL.createObjectURL( blob );

		const name = this.panel.settings.decoder.name || 'animation';

		const a = document.createElement( 'a' );
		a.href = url;
		a.download = name + '.tba';
		document.body.appendChild( a );
		a.click();
		document.body.removeChild( a );

		URL.revokeObjectURL( url );

	}

	setup() {

		const canvas = document.getElementById( 'canvas3d' );

		this.renderer = new THREE.WebGPURenderer( { canvas, antialias: true } );
		this.renderer.toneMapping = THREE.NeutralToneMapping;
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setAnimationLoop( () => {

			this.update();

		} );

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 1000 );
		this.camera.position.set( - 1, 2, 3 );

		this.controls = new OrbitControls( this.camera, canvas );
		this.controls.target.set( 0, 1, 0 );
		this.controls.update();

		this.grid = new THREE.GridHelper( 10, 10, 0x888888, 0x444444 );
		this.grid.position.y = 0.01;
		this.scene.add( this.grid );

		this.clock = new THREE.Clock();

		this.resize();

		//

		window.onresize = () => this.resize();

	}

	setupReflector() {

		const reflection = reflector();
		reflection.target.rotateX( - Math.PI / 2 );
		reflection.target.position.set( 0, .03, 0 );
		this.scene.add( reflection.target );

		const reflectionMask = positionWorld.xz.distance( 0 ).mul( .1 ).clamp().oneMinus();

		const floorMaterial = new THREE.NodeMaterial();
		floorMaterial.colorNode = vec4( reflection.rgb, reflectionMask );
		floorMaterial.opacity = .4;
		floorMaterial.transparent = true;

		const floor = new THREE.Mesh( new THREE.BoxGeometry( 50, .001, 50 ), floorMaterial );
		this.scene.add( floor );

	}

	setupLights() {

		const light = new THREE.HemisphereLight( 0x311649, 0x0c5d68, 10 );
		this.scene.add( light );

		const backLight = new THREE.DirectionalLight( 0xffffff, 10 );
		backLight.position.set( 0, 5, - 5 );
		this.scene.add( backLight );

		const keyLight = new THREE.DirectionalLight( 0xfff9ea, 4 );
		keyLight.position.set( 3, 5, 3 );
		this.scene.add( keyLight );

	}

	update() {

		const delta = this.clock.getDelta();

		this.player.update( delta );

		this.renderer.render( this.scene, this.camera );

	}

	setupBackground() {

		// Ready Player Me style background

		const horizontalEffect = screenUV.x.mix( color( 0x13172b ), color( 0x311649 ) );
		const lightEffect = screenUV.distance( vec2( 0.5, 1.0 ) ).oneMinus().mul( color( 0x0c5d68 ) );

		this.scene.backgroundNode = horizontalEffect.add( lightEffect );

	}

	testTBA() {

		const tbaLoader = new TBALoader();

		tbaLoader.load( './assets/walk.tba', ( data ) => {

			console.log('TBA Loaded:', data);

		}, undefined, ( error ) => {

			console.error('Error loading TBA:', error);

		} );

	}

}
