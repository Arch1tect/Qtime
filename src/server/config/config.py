import os

port = 80

if 'SWT_GEO' in os.environ and os.environ['SWT_GEO'] == 'ASIA':
	port = 80
	print "Running in Asian server"
else:
	port = 80
	print "Running in non-Asian server"
