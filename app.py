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
	arrayToReturn = []
	with open("data.txt", "r") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if not 'deleted' in entry or not entry['deleted']:
				arrayToReturn.append(entry)
		
		data["array"] = arrayToReturn
	# response.content_type = 'application/json'

	return data


@post('/api/data')
def addEntry():

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


	return {"id": newID}



@put('/api/data')
def changeEntry():

	jsonObj = request.json

	with open("data.txt", "r+") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if entry['id'] == jsonObj['id']:
				entry[jsonObj['colName']] = jsonObj['val']
		dataFile.seek(0)
		json.dump(entryArray, dataFile, indent=4)
		dataFile.truncate()


	return {"success":True}



@delete('/api/data')
def deleteEntry():

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


	return {"success":True}


run(host='localhost', port=80)