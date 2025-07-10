
import * as monaco from 'monaco-editor';

export default class Code {

	constructor() {

		const editorDOM = document.getElementById('code-container');
		const editor = monaco.editor.create( editorDOM, {
			value: this.getCode(),
			language: 'javascript',
			theme: 'vs-dark',
			automaticLayout: true,
			readOnly: true,
			minimap: { enabled: false }
		} );

	}

	show() {

		document.getElementById('code-container').style.display = 'block';

	}

	hide() {

		document.getElementById('code-container').style.display = 'none';

	}

	getCode() {

		return `// Three.js Binary Animation(TBA) Loader Example

// Load the GLB model
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// const glb = await new GLTFLoader().loadAsync( './model.glb' );

import { TBALoader } from 'three-tba';

const loader = new TBALoader();
const tba = await loader.loadAsync( './animation.tba' );

// The animation clip
const clip = tba.clip;

// The SkinnedMesh of the model
const readyPlayerTarget = glb.scene.children[ 0 ].children[ 1 ];

// Create or reuse an AnimationMixer
const mixer = new THREE.AnimationMixer( readyPlayerTarget );
mixer.clipAction( clip ).play();
`;

	}

}
