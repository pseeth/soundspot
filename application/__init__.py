"""
Here's how the app gets run. It creates an Flask app, pulls
boilerplate settings, and imports views, which contains all
the path handlers and functions for the app.
"""
from flask import Flask
import os

app = Flask('application')

if os.getenv('FLASK_CONF') == 'DEV':
	app.config.from_object('application.settings.Development')
elif os.getenv('FLASK_CONF') == 'TEST':
	app.config.from_object('application.settings.Testing')
else:
	app.config.from_object('application.settings.Production')

app.jinja_env.add_extension('jinja2.ext.loopcontrols')

import views

app.run()

