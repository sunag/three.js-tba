# Three.js Binary Animation(TBA) file.

Retargeting animation with ~16% the size of a JSON file.

[Open Editor](https://sunag.github.io/three.js-tba/)

<img width="600" alt="image" src="https://github.com/user-attachments/assets/36674343-58b1-40ed-9650-a40af290a99e" />

## Example

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TBALoader } from 'three-tba';

const glb = await new GLTFLoader().loadAsync( './jean.glb' );
const tba = await new TBALoader().loadAsync( './dance.tba' );

const clip = tba.clip;
const readyPlayerTarget = glb.scene.children[ 0 ].children[ 1 ];

const mixer = new THREE.AnimationMixer( readyPlayerTarget );
mixer.clipAction( clip ).play();
```

## Getting Started

**Install**
   ```powershell
   npm i three-tba
   ```
## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
