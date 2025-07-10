// Tweakpane setup for right panel
import { Pane } from 'tweakpane';

export default class Panel extends EventTarget {

	constructor() {

		super();

		this.view = '3d'; // Default view

		this.settings = {
			decoder: {
				name: '',
				hipInfluence: {
					x: true,
					y: true,
					z: true
				},
			},
			encoder: {
				fileSize: '0 KB',
				compressionRatio: '0.0',
				benchTime: '0 ms',
			}
		};

		this.pane = new Pane( {
			container: document.getElementById( 'panel-container' ),
		} )

		this.pane.on( 'change', ( e ) => {

			const key = e.target.key;

			if ( key === 'fileSize' || key === 'benchTime' || key === 'compressionRatio' ) return;

			this.dispatchEvent( new CustomEvent( 'change' ) );

		} );

		this.setupDropZone();
		this.setup3DCode();
		this.setupTutorial();
		this.setupPresets();
		this.setupDecoder();
		this.setupEncoder();

	}

	setup3DCode() {

		const btn3D = document.getElementById( 'view-3d-btn' );
		const btnCode = document.getElementById( 'view-code-btn' );
		const panel = document.getElementById( 'panel-container' );
		const viewToggle = document.getElementById( 'view-toggle' );

		btn3D.addEventListener( 'click', () => {

			btn3D.classList.add( 'active' );
			btnCode.classList.remove( 'active' );
			viewToggle.classList.remove( 'switch-code' );
			viewToggle.classList.add( 'switch-3d' );
			panel.style.display = '';

			this.view = '3d';

			this.dispatchEvent( new Event( 'view' ) );

		} );

		btnCode.addEventListener( 'click', () => {

			btnCode.classList.add( 'active' );
			btn3D.classList.remove( 'active' );
			viewToggle.classList.remove( 'switch-3d' );
			viewToggle.classList.add( 'switch-code' );
			panel.style.display = 'block';

			this.view = 'code';

			this.dispatchEvent( new CustomEvent( 'view' ) );

		} );

	}

	setupTutorial() {

		const overlay = document.getElementById( 'modal-tutorial-overlay' );

		overlay.addEventListener('click', ( e ) => {

			if ( e.target === overlay ) {

				overlay.style.display = 'none';

			}

		} );

	}

	setupPresets() {

		const preset = this.pane.addFolder( {
			title: 'PRESETS',
		} );

		preset.addBlade( {
			view: 'list',
			label: 'Decoder',
			options: [
				{ text: 'Mixamo', value: 'Mixamo' }
			],
			value: 'Mixamo'
		} );

		preset.addBlade( {
			view: 'list',
			label: 'Encoder',
			options: [
				{ text: 'Ready Player Me', value: 'ReadyPlayerMe' }
			],
			value: 'ReadyPlayerMe'
		} );

		const help = preset.addButton({
			title: 'HELP'
		});

		help.on( 'click', () => {

			this.openTutorial();

		} );

		const helpElement = help.element.querySelector('button');
		helpElement.style.background = '#ffb300';
		helpElement.style.color = '#fff';

	}

	setFileSize( size ) {

		this.settings.encoder.fileSize = `${( size / 1024 ).toFixed( 2 )} KB`;

	}

	setBenchTime( time ) {

		this.settings.encoder.benchTime = `${time.toFixed( 2 )} ms`;

	}

	setCompressionRatio( ratio ) {

		this.settings.encoder.compressionRatio = `${ratio.toFixed( 0 ) }% of total size`;

	}

	setupDecoder() {

		const settings = this.settings.decoder;

		const decoder = this.pane.addFolder( {
			title: 'DECODER',
		} );

		decoder.addBinding( settings, 'name', {
			label: 'animation name'
		} );

		const hipInfluence = decoder.addFolder( {
			title: 'Hip Influence',
		} );

		hipInfluence.addBinding( settings.hipInfluence, 'x' );
		hipInfluence.addBinding( settings.hipInfluence, 'y' );
		hipInfluence.addBinding( settings.hipInfluence, 'z' );

	}

	setupEncoder() {

		const settings = this.settings.encoder;

		const encoder = this.pane.addFolder( {
			title: 'ENCODER',
		} );

		encoder.addBinding( settings, 'fileSize', {
			label: 'file size',
			readonly: true,
			multiline: true,
			rows: 1,
		} );

		encoder.addBinding( settings, 'compressionRatio', {
			label: 'compression ratio',
			readonly: true,
			multiline: true,
			rows: 1,
		} );

		encoder.addBinding( settings, 'benchTime', {
			label: 'bench time',
			readonly: true,
		} );

		const download = encoder.addButton({
			title: 'DOWNLOAD'
		});

		const downloadElement = download.element.querySelector('button');
		downloadElement.style.background = '#007bff';
		downloadElement.style.color = '#fff';

		download.on( 'click', () => {

			this.dispatchEvent( new CustomEvent( 'download' ) );

		} );

	}

	openTutorial() {

		const overlay = document.getElementById('modal-tutorial-overlay');
		overlay.style.display = 'flex';

	}

	setupDropZone() {

		const dropzone = document.getElementById('dropzone');

		let dragCounter = 0;

		function showOverlay() {
			dropzone.classList.add('dropzone-active');
		}

		function hideOverlay() {
			dropzone.classList.remove('dropzone-active');
		}

		window.addEventListener('dragenter', (e) => {
			dragCounter++;
			showOverlay();
		});

		window.addEventListener('dragover', (e) => {
			e.preventDefault();
			showOverlay();
		});

		window.addEventListener('dragleave', (e) => {
			dragCounter--;
			if (dragCounter <= 0) {
				hideOverlay();
			}
		});

		window.addEventListener('drop', (e) => {
			hideOverlay();
			dragCounter = 0;
		});

		dropzone.addEventListener( 'drop', ( e ) => {

			e.preventDefault();

			const files = e.dataTransfer.files;

			if ( files.length > 0 ) {

				const file = files[ 0 ];
				const extension = file.name.split( '.' ).pop().toLowerCase();
				const reader = new FileReader();
				reader.onload = ( e ) => {

					this.dispatchEvent( new CustomEvent( 'drop', { detail: { data: e.target.result, file, extension } } ) );

				};

				reader.readAsArrayBuffer( file );

			}

		} );

	}

}
