from bottle import route, run, template, static_file
import json


# static routing
@route('/')
def server_static_home():
    return static_file('index.html', root='client/')

@route('/<filename>')
def server_static(filename):
    return static_file(filename, root='client/')


# dynamic routing
@route('/hello/<name>')
def index(name):
    return template('<b>Hello {{name}}</b>!', name=name)

@route('/api/data')
def getData():

	data = {}

	with open("data.txt", "r") as dataFile:
		data["array"] = json.load(dataFile)
	# response.content_type = 'application/json'

	return data

run(host='localhost', port=8080)