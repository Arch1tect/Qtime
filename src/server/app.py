# run from /src folder, i.e. python server/app.py
import sys
from bottle import Bottle, get, post, put, delete, route, request, run, template, static_file
from werkzeug.serving import run_simple
import json
from config import config

app = Bottle()

file_path = "db/data.txt"
# static routing
@app.route('/')
def server_static_home():
	return static_file('index.html', root='client/')

@app.route('/<filename>')
def server_static(filename):
	return static_file(filename, root='client/')

@app.route('/restart.log')
def server_static():
	return static_file('restart.log', root='')

@app.get('/api/data')
def getData():
	print "getData start"
	data = {}
	arrayToReturn = []
	with open(file_path, "r") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if not 'deleted' in entry or not entry['deleted']:
				arrayToReturn.append(entry)
		
		data["array"] = arrayToReturn

	print "getData done"

	return data


@app.post('/api/data')
def addEntry():
	print "addEntry start"

	jsonObj = request.json

	with open(file_path, "r+") as dataFile:
		entryArray = json.load(dataFile)

		lastID = -1
		if len(entryArray):
			lastID = entryArray[-1]['id']

		newID = lastID + 1
		jsonObj['id'] = newID

		entryArray.append(jsonObj)
		dataFile.seek(0)
		json.dump(entryArray, dataFile, indent=4)
		dataFile.truncate()

	print "addEntry done"

	return {"id": newID}



@app.put('/api/data')
def changeEntry():

	print "changeEntry start"

	jsonObj = request.json

	with open(file_path, "r+") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if entry['id'] == jsonObj['id']:
				entry[jsonObj['colName']] = jsonObj['val']
		dataFile.seek(0)
		json.dump(entryArray, dataFile, indent=4)
		dataFile.truncate()

	print "changeEntry done"

	return {"success":True}



@app.delete('/api/data')
def deleteEntry():

	print "deleteEntry start"
	jsonObj = request.json

	with open(file_path, "r+") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if entry['id'] == jsonObj['id']:
				# entryArray.remove(entry)
				entry['deleted'] = True
				break
		dataFile.seek(0)
		json.dump(entryArray, dataFile, indent=4)
		dataFile.truncate()

	print "deleteEntry done"

	return {"success":True}


run_simple('0.0.0.0', config.port, app, use_reloader=True)




