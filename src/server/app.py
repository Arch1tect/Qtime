# run from /src folder, i.e. python server/app.py
import sys
import threading
from bottle import Bottle, get, post, put, delete, route, request, response, HTTPResponse, run, template, static_file
from werkzeug.serving import run_simple
import json
from config import config

app = Bottle()
file_path = "db/data.txt"


class InvalidLogin(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Invalid login"}))

# static routing
@app.route('/')
def server_static_home():
	return static_file('index.html', root='client/')

@app.route('/<filename>')
def server_static(filename):
	return static_file(filename, root='client/')

@app.route('/build/<filename>')
def server_static(filename):
	return static_file(filename, root='client/build')


@app.route('/restart.log')
def server_static():
	response.set_header('Content-Type', 'text/plain; charset=utf-8')
	return static_file('restart.log', root='')


@app.post('/login')
def login():

	request_body = request.json
	validate(request_body['username'], request_body['password'])

	return {"success": True}


@app.get('/api/public')
def get_public_data():
	data = {}
	arrayToReturn = []
	with open(file_path, "r") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if not 'deleted' in entry or not entry['deleted']:
				arrayToReturn.append(entry)
		
		data["array"] = arrayToReturn
	return data


def validate(username, password):
	validated = False
	with open("db/account.txt", "r") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == username:
				validated = account['password'] == password
				break
	if not validated:
		raise InvalidLogin


@app.post('/api/data')
def get_data():

	request_body = request.json
	validate(request_body['username'], request_body['password'])

	data = {}
	active_entries = []
	with open('db/'+request_body['username'], "r") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if not 'deleted' in entry or not entry['deleted']:
				active_entries.append(entry)
		
		data["array"] = active_entries
	return data



@app.post('/api/data')
def add_entry():

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

	return {"id": newID}




@app.put('/api/data')
def change_entry():

	jsonObj = request.json

	with open(file_path, "r+") as dataFile:
		entryArray = json.load(dataFile)
		for entry in entryArray:
			if entry['id'] == jsonObj['id']:
				entry[jsonObj['colName']] = jsonObj['val']
		dataFile.seek(0)
		json.dump(entryArray, dataFile, indent=4)
		dataFile.truncate()

	return {"success":True}



@app.delete('/api/data')
def delete_entry():

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

	return {"success":True}


run_simple('0.0.0.0', config.port, app, use_reloader=True)




