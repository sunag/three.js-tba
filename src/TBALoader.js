import { FileLoader, AnimationClip } from 'three';

import * as msgpack from '@msgpack/msgpack';
import * as fflate from 'fflate';

class TBALoader extends FileLoader {

	constructor( manager ) {

		super( manager );

		this.responseType = 'arraybuffer';

	}

	load( url, onLoad, onProgress, onError ) {

		function onComplete( arrayBuffer ) {

			try {

				const bytes = new Uint8Array( arrayBuffer );
				const data = fflate.unzlibSync( bytes );
				const tba = msgpack.decode( data );

				tba.clip = AnimationClip.parse( tba.clip );
				tba.clip.name = tba.clip.name;

				if ( onLoad ) onLoad( tba );

			} catch ( error ) {

				if ( onError ) onError( error );

			}

		}

		return super.load( url, onComplete, onProgress, onError );

	}

}

export { TBALoader };
