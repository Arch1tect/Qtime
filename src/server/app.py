# run from /src folder, i.e. python server/app.py
import sys
import threading
from bottle import Bottle, get, post, put, delete, route, request, response, HTTPResponse, run, template, static_file
from werkzeug.serving import run_simple
import json
from config import config
import uuid
import hashlib


app = Bottle()
file_path = "db/data.txt"


class InvalidLoginException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Invalid login."}))

class AccountNotFoundException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Account not found."}))

class AccountExistedException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Username is taken."}))

class EmailExistedException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Email is registered."}))

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

# used by both password and token log in
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

# not used for password log in
def validate_request(fn):

	def wrapper(*args, **kwargs):
		username = request.get_cookie('username')
		token = request.get_cookie('token')
		validate(username, token)
		return fn(*args, **kwargs)
	return wrapper

def update_token(username): 
	''' Generate token and save to file'''
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

	request_body = request.json
	username = request.get_cookie('username')

	if request_body and 'password' in request_body:
		password = hashlib.sha512(request_body['password']).hexdigest()
		validate(username, password)
	else:
		token = request.get_cookie('token')
		validate(username, token)
		
	token = update_token(username)
	response.set_cookie('token', token)

	return {"success": True}

@app.post('/signup')
def signup():

	request_body = request.json
	token = str(uuid.uuid4())
	request_body['password'] = hashlib.sha512(request_body['password']).hexdigest()

	# try to add new account into account file, check for duplicates
	with open("db/account.txt", "r+") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == request_body['username']:
				raise AccountExistedException
			if account['email'] == request_body['email']:
				raise EmailExistedException

		# Didn't encounter problem, now create new account

		last_id = -1

		if len(account_array):
			last_id = account_array[-1]['id']

		new_id = last_id + 1

		request_body['id'] = new_id
		request_body['token'] = token

		account_array.append(request_body)
		account_file.seek(0)
		json.dump(account_array, account_file, indent=4)

	# create data file with default entry
	with open("db/"+request_body['username']+".txt", "w") as data_file:

		default_entry = {}
		default_entry['id'] = 0
		default_entry['name'] = 'Welcome!'
		default_entry['category'] = 'qtime'
		default_entry['duration'] = 1
		default_entry['link'] = ''
		default_entry['note'] = 'Please have a good time!'
		entry_array = [default_entry]

		json.dump(entry_array, data_file, indent=4)
	
	response.set_cookie('token', token)

	return {"success": True}


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
@validate_request
def get_data():

	username = request.get_cookie('username')
	data = {}
	active_entries = []

	with open('db/'+username+'.txt', "r") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if not 'deleted' in entry or not entry['deleted']:
				active_entries.append(entry)

		data["array"] = active_entries
	return data



@app.post('/api/add-entry')
@validate_request
def add_entry():

	request_body = request.json
	username = request.get_cookie('username')

	with open('db/'+username+'.txt', "r+") as data_file:
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




@app.put('/api/change-entry/<id>/<key>')
@validate_request
def change_entry(id, key):

	username = request.get_cookie('username')

	with open('db/'+username+'.txt', "r+") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if str(entry['id']) == id:
				entry[key] = request.body.read()
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"success":True}



@app.delete('/api/delete-entry/<id>')
@validate_request
def delete_entry(id):

	username = request.get_cookie('username')

	with open('db/'+ username +'.txt', "r+") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if entry['id'] == id:
				# entry_array.remove(entry)
				entry['deleted'] = True
				break
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"success":True}


run_simple('0.0.0.0', config.port, app, use_reloader=True)




