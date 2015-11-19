function makeID() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < 10; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
	return text;
};

var project_id;

$(document).on('change', '.btn-file :file', function() {
  var input = $(this),
      numFiles = input.get(0).files ? input.get(0).files.length : 1,
      label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
  input.trigger('fileselect', [numFiles, label]);
});

function validate_files(obj, file, message) {
	if (obj.context['name'] == 'score') {
		allowed = ['pdf'];
		split = file.split('.');
		if ($.inArray(split[split.length-1], allowed) > -1) {
			return true;
		}
	}
	if (obj.context['name'] == 'audio') {
		allowed = ['mp3', 'wav', 'aac', 'ogg'];
		split = file.split('.');
		if ($.inArray(split[split.length-1], allowed) > -1) {
			return true;
		}
	}
	message.text = 'Please upload something with one of the following extensions: ' + allowed.join();
	return false;
}

$(document).ready(function() {
	project_id = makeID();
	if (Cookies.get('user') == undefined) {
		Cookies.set('user', makeID(), {expires: 365});
	}
	$('.btn-file :file').on('fileselect', function (e, num, label) {
		var input = $(this).parents('.input-group').find(':text'),
			log = num > 1 ? num + 'files selected': label;
		if (input.length) {
			message = {'text': ''};
			if (validate_files($(this), log, message)) {
				input.val(log);
			}
			else {
				alert(message.text);
			}
		}
		else {
			if (log) alert(log);
		}
	});
});

function submit() {
	data  = new FormData();
	data.append('project_id', project_id);
	data.append('title', $('input[name=title]').val())
	if ($('input[name=title]').val().length == 0) {
		alert('You must name the project!');
	}
	data.append('score_file', $('input[name=score]')[0].files[0])
	data.append('audio_file', $('input[name=audio]')[0].files[0])
	data.append('user_id', Cookies.get('user'));
	$.ajax({
		type: 'POST',
		url: '/upload_project',
		data: data,
		processData: false,
		contentType: false
	}).done(function(data) {
		console.log(data);
		window.location.replace(data.redirect);
	});
}
