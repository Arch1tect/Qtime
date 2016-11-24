# run from /src folder, i.e. python server/wsgi.py
import sys
import threading
from bottle import Bottle, get, post, put, delete, route, request, response, HTTPResponse, run, template, static_file
from werkzeug.serving import run_simple
import json
from server.config import config
import uuid
import hashlib
import os

app = Bottle()
salt = "qtimesalt2016" # move to more secure place

DB_PATH = "../db/"

public_qtime_data = {}

# exceptions during request validation or login
class InvalidLoginException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=401, body=json.dumps({"error":"Invalid login."}))

class AccountNotFoundException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=401, body=json.dumps({"error":"Account not found."}))

# exceptions during signup
class UsernameExistedException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Username is taken."}))
class UsernameEmptyException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Username is empty."}))
class UsernameInvalidException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Username is invalid."}))
class EmailExistedException(HTTPResponse):
	def __init__(self):
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error":"Email is registered."}))

# static routing
@app.route('/')
def server_static_home():
	cwd = os.getcwd()
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
# end of static routing


# used by both password and token log in
def validate(username, password_or_token):
	validated = False
	found_account = False
	password_or_token = hashlib.sha512(salt+password_or_token).hexdigest()
	with open(DB_PATH+"account.txt", "r") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == username:
				found_account = True
				validated = account['password'] == password_or_token or ('token' in account and password_or_token==account['token'])
				break
	if not found_account:
		print "Account not found" # do not expose info that the username exist or not
	if not validated:
		raise InvalidLoginException

# Only for token, not used for password log in
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
	hashed_token = hashlib.sha512(salt+token).hexdigest()
	with open(DB_PATH+"account.txt", "r+") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == username:
				account['token'] = hashed_token
				break
		account_file.seek(0)
		json.dump(account_array, account_file, indent=4)
		account_file.truncate()
	return token

@app.post('/password-login')
def password_login():
	'''
	This is when user login using login form, read data from
	request body, don't read cookie
	'''
	request_body = request.json
	username = request_body['username']
	password = request_body['password']

	validate(username, password)

	token = update_token(username)
	response.set_cookie('token', token)
	response.set_cookie('username', username)

	return {"success": True}


@app.get('/token-login')
@validate_request
def token_login():
	
	# login success, update token
	# token = update_token(request.get_cookie('username'))
	# response.set_cookie('token', token)

	# commented out, if always update token when opening new tab,
	# then user always has to login again if they use more than one device or browser.

	return {"success": True}

def is_ascii(s):
    return all(ord(c) < 128 for c in s)

@app.post('/signup')
def signup():

	request_body = request.json
	request_body['password'] = hashlib.sha512(salt+request_body['password']).hexdigest()
	if request_body['username'] == '':
		raise UsernameEmptyException
	if not is_ascii(request_body['username']):
		raise UsernameInvalidException

	# try to add new account into account file, check for duplicates
	with open(DB_PATH+"account.txt", "r+") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == request_body['username']:
				raise UsernameExistedException
			if request_body['email'] != '' and account['email'] == request_body['email']:
				raise EmailExistedException

		# Didn't encounter problem, now create new account

		last_id = -1
		if len(account_array):
			last_id = account_array[-1]['id']
		new_id = last_id + 1
		request_body['id'] = new_id
		account_array.append(request_body)
		account_file.seek(0)
		json.dump(account_array, account_file, indent=4)

	# create data file with default entry
	with open(DB_PATH+request_body['username']+".txt", "w") as data_file:

		default_entry = {}
		default_entry['id'] = 0
		default_entry['name'] = 'Welcome!'
		default_entry['category'] = 'qtime'
		default_entry['duration'] = 1
		default_entry['link'] = ''
		default_entry['deleted'] = False
		default_entry['note'] = 'Please have a good time!'
		entry_array = [default_entry]

		json.dump(entry_array, data_file, indent=4)
	
	token = update_token(request_body['username'])
	response.set_cookie('token', token)
	response.set_cookie('username', request_body['username'])

	return {"success": True}


@app.get('/api/public')
def get_public_data():

	if "array" in public_qtime_data:
		return public_qtime_data

	arrayToReturn = []
	with open(DB_PATH+"public.txt", "r") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			# if not 'deleted' in entry or not entry['deleted']:
			arrayToReturn.append(entry)
		
		public_qtime_data["array"] = arrayToReturn
	return public_qtime_data


@app.get('/api/data')
@validate_request
def get_data():

	username = request.get_cookie('username')
	data = {}
	active_entries = []

	with open(DB_PATH+username+'.txt', "r") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if not 'removed' in entry:
				active_entries.append(entry)

		data["array"] = active_entries
	return data



@app.post('/api/entry')
@validate_request
def add_entry():

	request_body = request.json
	username = request.get_cookie('username')

	with open(DB_PATH+username+'.txt', "r+") as data_file:
		entry_array = json.load(data_file)

		lastID = -1
		if len(entry_array):
			lastID = entry_array[-1]['id']

		newID = lastID + 1
		request_body['id'] = newID
		request_body['deleted'] = False

		entry_array.append(request_body)
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"id": newID}




@app.put('/api/entry/<id>/<key>')
@validate_request
def change_entry(id, key):

	username = request.get_cookie('username')

	with open(DB_PATH+username+'.txt', "r+") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if str(entry['id']) == id:
				entry[key] = request.body.read()
				break
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"success":True}



@app.delete('/api/entry/<id>')
@validate_request
def delete_entry(id):

	username = request.get_cookie('username')

	with open(DB_PATH + username +'.txt', "r+") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if str(entry['id']) == id:
				# entry_array.remove(entry)
				if entry['deleted']:
					entry['removed'] = True # permanantly delete
				else:
					entry['deleted'] = True
				break
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"success":True}

@app.put('/api/recover-entry/<id>')
@validate_request
def recover_entry(id):

	username = request.get_cookie('username')
	with open(DB_PATH+username+'.txt', "r+") as data_file:
		entry_array = json.load(data_file)
		for entry in entry_array:
			if str(entry['id']) == id:
				entry['deleted'] = False
				print entry
				break
		data_file.seek(0)
		json.dump(entry_array, data_file, indent=4)
		data_file.truncate()

	return {"success":True}

if __name__ == '__main__':

	run_simple('0.0.0.0', config.port, app, use_reloader=True)




