import sqlite3

DATABASE = 'database.db'
def connect_to_database():
	return sqlite3.connect(DATABASE)

def get_db():
	db = connect_to_database()
	db.row_factory = sqlite3.Row
	return db

def init_db():
    with get_db() as db:
        with open('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

init_db()
