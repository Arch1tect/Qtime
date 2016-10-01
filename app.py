from bottle import get, post, put, delete, route, request, run, template, static_file
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

@get('/api/data')
def getData():

	data = {}

	with open("data.txt", "r") as dataFile:
		data["array"] = json.load(dataFile)
	# response.content_type = 'application/json'

	return data

@post('/api/data')
def addEntry():

	jsonObj = request.json

	with open("data.txt", "r+") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if(entry['id'] == jsonObj['id']):
				entry[jsonObj['colName']] = jsonObj['val']
		dataFile.seek(0)
		json.dump(entryArray, dataFile)
		dataFile.truncate()
	return "success"

@put('/api/data')
def changeEntry():

	jsonObj = request.json

	with open("data.txt", "r+") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if(entry['id'] == jsonObj['id']):
				entry[jsonObj['colName']] = jsonObj['val']
		dataFile.seek(0)
		json.dump(entryArray, dataFile)
		dataFile.truncate()
	return "success"

@delete('/api/data')
def deleteEntry():

	jsonObj = request.json

	with open("data.txt", "r+") as dataFile:
		entryArray = json.load(dataFile)
		entryToRemove
		for entry in entryArray:
			if(entry['id'] == jsonObj['id']):
				entryArray.remove(entry)
				entryToRemove = entry
				break
		dataFile.seek(0)
		json.dump(entryArray, dataFile)
		dataFile.truncate()


	return "success"


run(host='localhost', port=8080)