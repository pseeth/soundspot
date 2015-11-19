drop table if exists project;
drop table if exists annotations;
create table project (
	id integer primary key,
	project_id text,
	title text,
	score_file text,
	audio_file text,
	user_id text
);
create table annotations (
	id integer primary key,
	annotation_id text,
	annotation_audio text,
	project_id text,
	annotation text,
	user_id text,
	session_id text
);
