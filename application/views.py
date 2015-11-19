from flask import render_template, request, jsonify, send_file
from application import app
from database_utilities import query_db, alter_db
from werkzeug import secure_filename
import os
import traceback
from subprocess import call
import json


@app.route('/')
def base():
	try:
		projects = query_db('select * from project')
		links = []
		num_annotations = []
		for p in projects:
			project_id = p['project_id']
			annotations = query_db('select * from annotations where project_id = :project_id', {'project_id' : project_id})
			num_annotations.append(len(annotations))
			project_folder = '../data/' + project_id + '/'
			links.append([project_folder + f for f in os.listdir('data/' + project_id + '/') if f.endswith(".png")][0])
		return render_template('base.html', projects = projects, links = links, num_annotations = num_annotations)
	except:
		traceback.print_exc()

@app.route('/data/<path:path>')
def send_data(path):
	try:
		return send_file(os.path.join('../data', path))
	except:
		traceback.print_exc()

@app.route('/create')
def create():
	return render_template('create.html')

@app.route('/upload_annotation', methods=['POST'])
def upload_annotation():
	try:
		data = request.form
		files = request.files
		annotation = {}
		annotation['annotation_id'] = data['annotation_id']
		annotation['project_id'] = data['project_id']
		annotation_object = json.loads(data['annotation'])
		
		if request.files:
			print 'here i am'
			folder = 'data/' + data['project_id'] + '/annotations'
			if not os.path.isdir(folder):
				os.mkdir(folder)
			f = request.files['annotation_audio']
			filename = secure_filename(data['annotation_id'] + '.wav')
			path = os.path.join(folder, filename)
			f.save(path)
			annotation['annotation_audio'] = path
			annotation_object['audio_url'] = '/' + path
		else:
			annotation['annotation_audio'] = ''

		annotation['annotation'] = json.dumps(annotation_object)
		annotation['user_id'] = data['user_id']
		annotation['session_id'] = data['session_id']
		
		existing_annotation = query_db('select * from annotations where annotation_id = :annotation_id', {'annotation_id': annotation['annotation_id']}, one=True)
		if not existing_annotation:
			alter_db('insert into annotations (annotation_id, annotation_audio, project_id, annotation, user_id, session_id) values (:annotation_id, :annotation_audio, :project_id, :annotation, :user_id, :session_id)', annotation) 
		else:
			alter_db('update annotations set annotation_id = :annotation_id, annotation_audio = :annotation_audio, project_id = :project_id, annotation = :annotation, user_id = :user_id, session_id = :session_id where annotation_id = :annotation_id', annotation) 
		response = jsonify(dict(success = 'true'))
		response.status_code = 200
		return response
	except:
		traceback.print_exc()
		response = jsonify(dict(success = 'false'))
		response.status_code = 500
		return response

@app.route('/upload_project', methods=['POST'])
def upload_project():
	try:
		data = request.form
		files = request.files
		folder = 'data/' + data['project_id']
		uploaded_files = []
		args = {}
		if not os.path.isdir(folder):
			os.mkdir(folder)
		for k in request.files:
			f = request.files[k]
			filename = secure_filename(f.filename)
			args[k] = filename
			path = os.path.join(folder, filename)
			f.save(path)
			uploaded_files.append(path)
			if k == 'score_file':
				png_file = ''.join(path.split('.')[0:-1]) + '.png'
				call(['convert', '-density', '150', path, '-append', png_file])
				call(['convert', '-trim', png_file, png_file])
		
		if 'audio_file' not in args:
			args['audio_file'] = ''
		args['project_id'] = data['project_id']
		args['title'] = data['title']
		args['user_id'] = data['user_id']
		args = sanitize(args)
		alter_db('insert into project (project_id, title, score_file, audio_file, user_id) values (:project_id, :title, :score_file, :audio_file, :user_id)', args) 
		response = jsonify(dict(success = 'true', redirect = '/review/' + request.form['project_id'] ))
		response.status_code = 200
		return response
	except:
		traceback.print_exc()
		response = jsonify(dict(success = 'false'))
		response.status_code = 500
		return response

def sanitize(args):
	return args

@app.route('/review/<project_id>')
def review(project_id):
	try:
		project_id = sanitize(project_id)
		project = query_db('select * from project where project_id = :project_id', {'project_id': project_id}, one = True)
		project_name = project['title']
		project_folder = '../data/' + project_id + '/'
		audio = project_folder + project['audio_file']
		score = [project_folder + f for f in os.listdir('data/' + project_id + '/') if f.endswith(".png")]
		audio_exists = (project['audio_file'] != '')
		print project_name, audio, score
		return render_template('review.html', project_name = project_name, audio = audio, score = score, audio_exists = audio_exists, project_id = project_id)
	except:
		traceback.print_exc()

@app.route('/view/<project_id>')
def view(project_id):
	try:
		project_id = sanitize(project_id)
		project = query_db('select * from project where project_id = :project_id', {'project_id': project_id}, one = True)
		project_name = project['title']
		project_folder = '../data/' + project_id + '/'
		audio = project_folder + project['audio_file']
		score = [project_folder + f for f in os.listdir('data/' + project_id + '/') if f.endswith(".png")]
		audio_exists = (project['audio_file'] != '')
		
		annotations = query_db('select * from annotations where project_id = :project_id', {'project_id': project_id})
		annotation_objects = [json.loads(a['annotation']) for a in annotations]
		annotations = json.dumps(annotation_objects)

		return render_template('view.html', annotations = annotations, project_name = project_name, audio = audio, score = score, audio_exists = audio_exists, project_id = project_id)
	except:
		traceback.print_exc()
