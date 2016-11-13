# run from /src folder, i.e. python server/app.py
import sys
import threading
from bottle import Bottle, get, post, put, delete, route, request, response, HTTPResponse, run, template, static_file
from werkzeug.serving import run_simple
import json
from config import config
import uuid
app = Bottle()
file_path = "db/data.txt"


class InvalidLoginException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Invalid login"}))

class AccountNotFoundException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Account not found"}))

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


# Bottle's built in basic authentication will challenge client with popup, 
# to avoid that, return 400 instead
def validate(username, password_or_token):
	validated = False
	found_account = False
	with open("db/account.txt", "r") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == username:
				found_account = True
				validated = account['password'] == password_or_token or ('token' in account and password_or_token==account['token'])
				break
	if not found_account:
		raise AccountNotFoundException
	if not validated:
		raise InvalidLoginException

def generate_token(username): 
	token = str(uuid.uuid4())
	with open("db/account.txt", "r+") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == username:
				account['token'] = token
				break
		account_file.seek(0)
		json.dump(account_array, account_file, indent=4)
		account_file.truncate()
	return token

@app.post('/login')
def login():
	username = request.auth[0]
	password_or_token = request.auth[1]
	validate(username, password_or_token)
	token = generate_token(username)

	return {"success": True, "token": token}


@app.get('/api/public')
def get_public_data():
	data = {}
	arrayToReturn = []
	with open(file_path, "r") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if not 'deleted' in entry or not entry['deleted']:
				arrayToReturn.append(entry)
		
		data["array"] = arrayToReturn
	return data


@app.get('/api/data')
def get_data():

	# request_body = request.json
	data = {}
	active_entries = []
	with open('db/'+request.auth[0]+'.txt', "r") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if not 'deleted' in entry or not entry['deleted']:
				active_entries.append(entry)
		
		data["array"] = active_entries
	return data



@app.post('/api/add-entry')
def add_entry():

	request_body = request.json

	with open('db/'+request.auth[0]+'.txt', "r+") as data_file:
		entry_array = json.load(data_file)

		lastID = -1
		if len(entry_array):
			lastID = entry_array[-1]['id']

		newID = lastID + 1
		request_body['id'] = newID

		entry_array.append(request_body)
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"id": newID}




@app.put('/api/change-entry')
def change_entry():

	request_body = request.json

	with open('db/'+request.auth[0]+'.txt', "r+") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if entry['id'] == request_body['id']:
				entry[request_body['colName']] = request_body['val']
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"success":True}



@app.delete('/api/delete-entry')
def delete_entry():

	request_body = request.json

	with open('db/'+request.auth[0]+'.txt', "r+") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if entry['id'] == request_body['id']:
				# entry_array.remove(entry)
				entry['deleted'] = True
				break
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"success":True}


run_simple('0.0.0.0', config.port, app, use_reloader=True)




