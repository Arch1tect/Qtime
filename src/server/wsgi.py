# run from /src folder, i.e. python server/wsgi.py
# -*- coding: utf-8 -*-
import sys
import threading
from bottle import Bottle, get, post, put, delete, route, request, response, HTTPResponse, run, template, static_file
from werkzeug.serving import run_simple
import json
from server.config import config
import uuid
import hashlib
import os
import time

app = Bottle()
salt = "qtimesalt2016" # move to more secure place, can't change it

DB_PATH = "../db/"
LANG = 'en'
if 'QTIME_LANG' in os.environ and os.environ['QTIME_LANG'] == 'cn':
	LANG = 'cn'

public_qtime_data = {}

# exceptions during request validation or login
class EmptyUsernameException(HTTPResponse):
	def __init__(self, lang):
		msg = "Username is not in cookie."
		if lang == 'cn':
			msg = "Cookie中没有用户名"
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error": msg}))

class EmptyTokenException(HTTPResponse):
	def __init__(self, lang):
		msg = "Token is not in cookie."
		if lang == 'cn':
			msg = "Cookie中没有密匙"
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error": msg}))

class InvalidLoginException(HTTPResponse):
	def __init__(self, lang):
		msg = "Login failed."
		if lang == 'cn':
			msg = "登录失败"
		HTTPResponse.__init__(self, status=401, body=json.dumps({"error": msg}))

class AccountNotFoundException(HTTPResponse):
	def __init__(self, lang):
		msg = "Account not found."
		if lang == 'cn':
			msg = "用户名不存在"
		HTTPResponse.__init__(self, status=401, body=json.dumps({"error": msg}))

# exceptions during signup
class UsernameExistedException(HTTPResponse):
	def __init__(self, lang):
		msg = "Username is taken."
		if lang == 'cn':
			msg = "该用户名已注册"
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error": msg}))
class UsernameEmptyException(HTTPResponse):
	def __init__(self, lang):
		msg = "username is empty."
		if lang == 'cn':
			msg = "用户名不可空"
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error": msg}))
class UsernameInvalidException(HTTPResponse):
	def __init__(self, lang):
		msg = "Username is invalid."
		if lang == 'cn':
			msg = "用户名无效"
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error": msg}))
class EmailExistedException(HTTPResponse):
	def __init__(self, lang):
		msg = "Email is registered."
		if lang == 'cn':
			msg = "邮箱已注册"
		HTTPResponse.__init__(self, status=400, body=json.dumps({"error": msg}))

# static routing
@app.route('/')
def server_static_home():
	response = static_file('index.html', root='client/')
	response.set_cookie('lang', LANG)
	return response

@app.route('/<filename>')
def server_static(filename):
	return static_file(filename, root='client/')

@app.route('/build/<filename>')
def server_static(filename):
	return static_file(filename, root='client/build')

@app.route('/style/<filename>')
def server_static(filename):
	return static_file(filename, root='client/style')

@app.route('/js/<filename>')
def server_static(filename):
	return static_file(filename, root='client/js')

@app.route('/js/lib/<filename>')
def server_static(filename):
	return static_file(filename, root='client/js/lib')

@app.route('/restart.log')
def server_static():
	response.set_header('Content-Type', 'text/plain; charset=utf-8')
	return static_file('restart.log', root='')
# end of static routing


# used by both password and token log in
def validate(username, password_or_token, lang='en'):
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
		raise InvalidLoginException(lang)

# Only for token, not used for password log in
def validate_request(fn):

	def wrapper(*args, **kwargs):
		username = request.get_cookie('username')
		token = request.get_cookie('token')
		lang = request.get_cookie('lang')

		if not username:
			raise EmptyUsernameException(lang)
		if not token:
			raise EmptyTokenException(lang)

		validate(username, token, lang)
		# time.sleep(2)
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
	lang = request.get_cookie('lang')

	validate(username, password, lang)

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

	lang = request.get_cookie('lang')
	request_body = request.json
	request_body['password'] = hashlib.sha512(salt+request_body['password']).hexdigest()
	if request_body['username'] == '':
		raise UsernameEmptyException(lang)
	if not is_ascii(request_body['username']):
		raise UsernameInvalidException(lang)

	# try to add new account into account file, check for duplicates
	with open(DB_PATH+"account.txt", "r+") as account_file:
		account_array = json.load(account_file)
		for account in account_array:
			if account['username'] == request_body['username']:
				raise UsernameExistedException(lang)
			if request_body['email'] != '' and account['email'] == request_body['email']:
				raise EmailExistedException(lang)

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
		default_entry['category'] = 'Qtime'
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
	# time.sleep(5)

	# if "array" in public_qtime_data:
	# 	return public_qtime_data

	arrayToReturn = []
	with open(DB_PATH+"public-"+LANG+".txt", "r") as data_file:
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




