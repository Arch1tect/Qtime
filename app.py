from bottle import Bottle, get, post, put, delete, route, request, run, template, static_file
from werkzeug.serving import run_simple
import json
import config

app = Bottle()

# static routing
@app.route('/')
def server_static_home():
    return static_file('index.html', root='client/')

@app.route('/<filename>')
def server_static(filename):
    return static_file(filename, root='client/')


# dynamic routing
@app.route('/hello/<name>')
def index(name):
    return template('<b>Hello {{name}}</b>!', name=name)

@app.get('/api/data')
def getData():
	print "getData start"
	data = {}
	arrayToReturn = []
	with open("data.txt", "r") as dataFile:
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

	with open("data.txt", "r+") as dataFile:
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

	with open("data.txt", "r+") as dataFile:
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

	with open("data.txt", "r+") as dataFile:
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




