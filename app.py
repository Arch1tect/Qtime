from bottle import route, run, template, static_file


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

	# response.content_type = 'application/json'
	data = { 'array': [{ 'index':0, 'title': 'Watchmen', 'duration': 186, 'category': 'movie', 'note': 'Hulu'},{ 'index':1, 'title': 'Mob Psycho 100', 'duration': 25, 'category': 'anime', 'note': 'Bilibili'},{ 'index':2, 'title': 'Intersteller', 'duration': 150, 'category': 'movie', 'note': 'Hulu'},{'index':3, 'title': 'toto sound', 'duration': 25, 'category': 'anime', 'note': 'Hulu'},{ 'index':4, 'title': 'South Park', 'duration': 20, 'category': 'show', 'note': 'Hulu'},{ 'index':5, 'title': 'ha', 'duration': 5, 'category': 'anime', 'note': 'Bilibili'}]}
	return data

run(host='localhost', port=8080)