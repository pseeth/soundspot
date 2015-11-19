var context;
var currentBlob, currentAudio;
var recorder;

var annotation_id;
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


audio_annotator.record = function() {
	audio_annotator.recording = !audio_annotator.recording;
	if (audio_annotator.recording) {
		$("#record").html('<span class="glyphicon glyphicon-stop"></span> Stop recording');
		recorder && recorder.record()
	}
	else {
		$("#record").html('<span class="glyphicon glyphicon-record"></span> Record a sound annotation');
		recorder && recorder.stop();
		createDownloadLink();
		recorder.clear();
	}
}

function startUserMedia(stream) {
	var input = context.createMediaStreamSource(stream);
	console.log('Media stream created.' );
	console.log("input sample rate " +input.context.sampleRate);

	gain = context.createGain();
	input.connect(gain);
	console.log('Input connected to dummy gain.');

	recorder = new Recorder(input);
	console.log('Recorder initialised.');
	$("#record").attr('disabled', false);
}

function createDownloadLink() {
	recorder && recorder.exportWAV(function(blob) {
    	var url = (window.URL || window.webkitURL).createObjectURL(blob);
		currentAudio = url;
		currentBlob = blob;
		if (audio_annotator.wavesurfer) {
			audio_annotator.wavesurfer.empty();
			$('#recorded-waveform').html('');
		}
		setup_wavesurfer(audio_annotator, '#recorded-waveform', currentAudio, 35, 0);
		audio_annotator.updated = true;
	});
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

var session_id;

$(document).ready(function() {
	session_id = makeID();
	if (Cookies.get('user') == undefined) {
		Cookies.set('user', makeID(), {expires: 365});
	}

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
	annotation_id = makeID()
	try {
		// webkit shim
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		navigator.getUserMedia = 	(navigator.getUserMedia ||
					   				navigator.webkitGetUserMedia ||
					   				navigator.mozGetUserMedia ||
					   				navigator.msGetUserMedia);
		window.URL = window.URL || window.webkitURL;

		context = new AudioContext;
		console.log('Audio context set up.');
		console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
		} catch (e) {
		}

		navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
			console.log('No live audio input: ' + e);
		});	
});

function randomColor(alpha) {
    return 'rgba(' + [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        alpha || 1
    ] + ')';

}

function saveRegions() {
    localStorage.regions = JSON.stringify(
        Object.keys(music.wavesurfer.regions.list).map(function (id) {
            var region = music.wavesurfer.regions.list[id];
            return {
                start: region.start,
                end: region.end,
                attributes: region.attributes,
                data: region.data
            };
        })
    );
}


/**
 * Load regions from localStorage.
 */
function loadRegions(regions) {
    regions.forEach(function (region) {
        region.color = randomColor(0.1);
        music.wavesurfer.addRegion(region);
    });
}

function editAnnotation (region) {
    var form = document.forms.edit;
    form.style.opacity = 1;
    form.elements.start.value = Math.round(region.start * 10) / 10,
    form.elements.end.value = Math.round(region.end * 10) / 10;
    form.elements.note.value = region.data.note || '';
    form.onsubmit = function (e) {
        e.preventDefault();
        region.update({
            start: form.elements.start.value,
            end: form.elements.end.value,
            data: {
                note: form.elements.note.value
            }
        });
        form.style.opacity = 0;
    };
    form.onreset = function () {
        form.style.opacity = 0;
        form.dataset.region = null;
    };
    form.dataset.region = region.id;
}

function showNote (region) {
    if (!showNote.el) {
        showNote.el = document.querySelector('#subtitle');
    }
    showNote.el.textContent = region.data.note || '–';
}

function submit() {
	annotations = anno.getAnnotations();
	forms = []
	for (a in annotations) {
		data = new FormData();
		data.append('project_id', project_id);
		data.append('annotation_id', annotations[a].id);
		data.append('annotation_audio', annotations[a].audio_blob)
		data.append('annotation', JSON.stringify(annotations[a]))
		data.append('session_id', session_id);
		data.append('user_id', Cookies.get('user'));
		forms.push(data)
	}
	upload_annotations(0, forms);
}

function upload_annotations(i, forms) {
	if (i >= forms.length) {
		return;
	}
	$.ajax({
		type: 'POST',
		url: '/upload_annotation',
		data: forms[i],
		processData: false,
		contentType: false
	}).done(function(data) {
		console.log(data);
		upload_annotations(i+1, forms)
	});
}
