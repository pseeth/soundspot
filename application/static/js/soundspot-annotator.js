function makeID() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < 10; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
	return text;
};

annotorious.plugin.SoundSpot = function (opt_config_options) {

}

annotorious.plugin.SoundSpot.prototype.initPlugin = function(anno) {
	$(".words").tagsinput({
		confirmKeys: [13,9,188,32]
	});
}

annotorious.plugin.SoundSpot.prototype.onInitAnnotator = function(annotator) {
	var tag_input = '<div class="words-input"><input class="words" type="text" value="" placeholder="Tag this part of the score with words."></div>';
	var audio_input = '<div id="audio-input"><button type="button" class="btn btn-default btn-sm" id="record" onclick="audio_annotator.record();"><span class="glyphicon glyphicon-record"></span> Record a sound annotation</button></div>'
	var audio_toggle = '<div id="audio-annotation"><button type="button" class="btn btn-default btn-sm" id="play_annotation" onclick="audio_annotator.toggle();"><span class="glyphicon glyphicon-play"></span> Play sound annotation</button></div>'
	var audio_waveform = '<div id="recorded-waveform"></div>';
	var annotation_waveform = '<div id="annotation-waveform"></div>';
	var tag_viewer = '<div class="tag-viewer"><p class="annotation-tags"></p></div>';
	annotator.editor.addField(tag_input);    
	annotator.editor.addField(audio_input);    
	annotator.editor.addField(audio_waveform);    
	annotator.popup.addField(tag_viewer);
	annotator.popup.addField(audio_toggle);
	annotator.popup.addField(annotation_waveform);
	annotator.addHandler('onEditorShown', function (annotation) {
		if (audio_annotator.playing) {
			audio_annotator.toggle();
		}
		$('.words').tagsinput('removeAll');
		audio_annotator.updated = false;
		if (annotation) {
			$('#recorded-waveform').html('');
			$('.words').tagsinput('add', annotation.tags);
			if (audio_annotator.wavesurfer != undefined) {
				audio_annotator.wavesurfer.empty();
			}
			if (annotation.audio_url != undefined) {
				setup_wavesurfer(audio_annotator, '#recorded-waveform', annotation.audio_url, 35, 0);
			}
		}
		else {
			$('#recorded-waveform').html('');
		}
	});
	annotator.addHandler('onAnnotationCreated', function (annotation) {
		var tags = $('.words').val();
		annotation.tags = tags;
		annotation.id = makeID();
		annotation.session_id = session_id;
		annotation.user_id = Cookies.get('user');
		annotation.project_id = project_id;
		if (audio_annotator.updated) {
			annotation.audio_url = currentAudio;
			annotation.audio_blob = currentBlob;
		}
	});
	annotator.addHandler('onAnnotationUpdated', function (annotation) {
		var tags = $('.words').val();
		annotation.tags = tags;
		if (audio_annotator.updated) {
			annotation.audio_url = currentAudio;
			annotation.audio_blob = currentBlob;
		}
	});
	annotator.addHandler('onPopupShown', function (annotation) {
		if (annotation.tags != '') {
			var tags = annotation.tags.split(',').map(function(a) {return '#' + a}).join(' ');
			$('.annotation-tags').text(tags);
		} else {
			$('.annotation-tags').text('');
		}
		if (audio_annotator.wavesurfer != undefined) {
			$('#annotation-waveform').html('');
			audio_annotator.wavesurfer.empty();
		}
		if (annotation.audio_url != undefined) {
			$('#annotation-waveform').show();
			$('#audio-annotation').show();
			setup_wavesurfer(audio_annotator, '#annotation-waveform', annotation.audio_url, 35, 0)
		}
		else {
			$('#annotation-waveform').hide();
			$('#audio-annotation').hide();
		}
	});
	annotator.addHandler('onMouseOutOfAnnotation', function (e) {
		if (audio_annotator.playing) {
			audio_annotator.toggle();
		}
	});
	annotator.addHandler('beforePopupHide', function (e) {
		if (audio_annotator.playing) {
			audio_annotator.toggle();
		}
	});
	annotator.addHandler('onAnnotationRemoved', function (e) {
		if (audio_annotator.playing) {
			audio_annotator.toggle();
		}
	});
	
		
}


