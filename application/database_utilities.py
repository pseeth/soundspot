import sqlite3
from flask import g
from application import app

DATABASE = 'database.db'

def connect_to_database():
	return sqlite3.connect(DATABASE)

def get_db():
	db = getattr(g, '_database', None)
	if db is None:
		db = g._database = connect_to_database()
	db.row_factory = sqlite3.Row
	return db

@app.teardown_appcontext
def close_connection(exception):
	db = getattr(g, '_database', None)
	if db is not None:
		db.close()

def init_db():
    with get_db() as db:
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

def query_db(query, args=(), one=False):
	cur = get_db().execute(query, args)
	rv = cur.fetchall()
	cur.close()
	return (rv[0] if rv else None) if one else rv

def alter_db(query, args=(), one=False):
	db = get_db()
	cur = db.execute(query, args)
	rv = cur.fetchall()
	db.commit()
	cur.close()
	return (rv[0] if rv else None) if one else rv
