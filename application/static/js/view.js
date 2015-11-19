var wavesurfer;
audio_annotator = {playing: false, recording: false};
music = {playing: false}

music.toggle = function() {
	if (music.playing) {
		$("#playstop").html('<span class="glyphicon glyphicon-play"></span>');
		music.wavesurfer.pause();
	}
	else {
		$("#playstop").html('<span class="glyphicon glyphicon-pause"></span>');
		music.wavesurfer.play();
	}
	music.playing = !music.playing;
}

audio_annotator.toggle = function() {
	if (audio_annotator.playing) {
		$("#play_annotation").html('<span class="glyphicon glyphicon-play"></span> Play sound annotation');
		audio_annotator.wavesurfer.pause();
	}
	else {
		$("#play_annotation").html('<span class="glyphicon glyphicon-pause"></span> Pause sound annotation');
		audio_annotator.wavesurfer.play();
	}
	audio_annotator.playing = !audio_annotator.playing;
}

function setup_wavesurfer(obj, id, audio_url, h, bw) {
	obj.wavesurfer = WaveSurfer.create({
		container: id,
		waveColor: 'lightgray',
		progressColor: '#337ab7',
		barWidth: bw,
		normalize: true,
		cursorWidth: 0,
		height: h
	});
	obj.wavesurfer.load(audio_url);
	obj.wavesurfer.enableDragSelection({
		color: randomColor(0.1)
	});
	
	obj.wavesurfer.on('finish', function () {
			if (obj.playing) {
				obj.toggle();
			}
		});
}

function randomColor(alpha) {
    return 'rgba(' + [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        alpha || 1
    ] + ')';

}
$(window).resize(function() {
	if (audio_annotator.playing) {
		audio_annotator.toggle();
	}
	annotation_saved = $.extend(true, [], anno.getAnnotations());
	anno.reset();
	for (i in annotation_saved) {
		anno.addAnnotation(annotation_saved[i]);
	}
	
	restart = false;
	if (music.playing) {music.wavesurfer.pause(); restart = true}
	music.wavesurfer.empty();
	music.wavesurfer.drawBuffer();
	if (restart) {music.wavesurfer.play();}
});

$(document).ready(function() {
	if (audio_exists) {
		setup_wavesurfer(music, '#audio-waveform', audio_location, 50, 1);
	}
	anno.addPlugin('SoundSpot', {});
	anno.setProperties({
		outline: 'rgba(51, 122, 183, 1)',
		fill: 'rgba(51, 122, 183, .2)',
		outline_width: 1,
		stroke_width: 1,
		hi_stroke: 'rgba(51, 122, 183, 1)',
		hi_outline: 'rgba(51, 122, 183, 1)',
		hi_fill: 'rgba(51, 122, 183, .2)',
		hi_outline_width: 1,
		hi_stroke_width: 0
	});
	load_annotations();
});

function load_annotations() {
	anno.reset()
	for (a in annotations) {
		console.log(annotations[a])	
		annotations[a].editable = false;
		//just to make sure we are always getting the latest audio annotation
		if (annotations[a].audio_url != undefined) {
			annotations[a].audio_url += "?" + makeID()
		}
		anno.addAnnotation(annotations[a]);
	}
}
