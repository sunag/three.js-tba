export default class Player {

	constructor() {

		this.playBtn = document.getElementById( 'play-btn' );
		this.stopBtn = document.getElementById( 'stop-btn' );
		this.timeline = document.getElementById( 'timeline' );

		this.isPlaying = false;
		this.isTimeline = false;
		this.animationFrame = null;
		this.playBtnIcon = this.playBtn.querySelector( 'i' );
		this.timeline.max = 1000;
		this.updateTimelineUI();
		this.stopBtn.disabled = true;
		this.playBtn.addEventListener( 'click', () => {

			if ( this.isPlaying ) {

				this.pause();

			} else {

				this.play();

			}

		} );

		this.stopBtn.addEventListener( 'click', () => this.stop() );
		this.timeline.addEventListener( 'input', ( e ) => {

			// Set isTimeline to true while dragging
			this.isTimeline = true;
			this.currentTime = parseInt( e.target.value, 10 );

		} );

		// Resume play if it was playing before dragging
		this.timeline.addEventListener( 'mouseup', () => {
			this.isTimeline = false;
		} );

	}

	get duration() {

		return this.timeline.max;

	}

	setAnimation( mixer, clip ) {

		this.mixer = mixer;
		this.clip = clip;
		this.timeline.max = clip.duration * 1000; // Convert to milliseconds

	}

	update( delta ) {

		if ( ! this.mixer ) return;

		if ( this.isPlaying && ! this.isTimeline ) {

			this.mixer.update( delta );
			this.updateTimelineUI();

		} else {

			this.mixer.setTime( this.currentTime / 1000 );

		}


	}

	set currentTime( time ) {

		this.mixer.time = time / 1000; // Convert milliseconds to seconds
		this.updateTimelineUI();

	}

	get currentTime() {

		if ( ! this.mixer ) return 0;

		return this.mixer.time * 1000; // Convert to milliseconds

	}

	updateTimelineUI() {

		this.timeline.value = this.currentTime % this.timeline.max;

	}

	setPlayIcon( isPlay ) {

		if ( isPlay ) {

			this.playBtnIcon.className = 'ti ti-player-play-filled';

		} else {

			this.playBtnIcon.className = 'ti ti-player-pause-filled';

		}

	}

	play() {

		if ( this.isPlaying ) return;
		this.isPlaying = true;
		this.stopBtn.disabled = false;
		this.setPlayIcon( false ); // pause icon

	}

	pause() {

		if ( ! this.isPlaying ) return;
		this.isPlaying = false;
		this.setPlayIcon( true ); // play icon
		this.playBtn.disabled = false;
		this.stopBtn.disabled = false;

	}

	stop() {

		this.isPlaying = false;
		this.playBtn.disabled = false;
		this.stopBtn.disabled = true;
		this.setPlayIcon( true ); // play icon
		this.currentTime = 0;
		this.updateTimelineUI();

	}

}
