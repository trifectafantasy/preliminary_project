##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### PYTHON SCRIPT TO EXECUTE #####

# in a subprocess, open mongodb connection
mongod = subprocess.Popen(["mongod"])
time.sleep(.5)

# connect to MongoDB
try:
	client = MongoClient('mongodb://localhost:27017')
	print "Successful connection"

except pymongo.errors.ConnectionFailure, e:
	print "Count not connect to MongoDB: %s" % e

# use collection 'espn'
db = client.espn
time.sleep(1)
# define collections to be used
collection_trophy = "trophy_list"

print "-----Insert Trophies-----"

while True:

	try:
		sport = raw_input("What sport is this award for? > ")
		name = raw_input("What is the name of the award? > ")
		description = raw_input("What is the description of the award? > ")

		print "Sport", sport
		print name, ":", description

		raw_input("Press any button to confirm")

		insert_json = OrderedDict()
		insert_json = {"sport": sport, "name": name, "description": description}

		db[collection_trophy].insert(insert_json)
		print "Trophy inserted"
		print ""

	except KeyboardInterrupt:
		print "Goodbye"
		# sleep and terminate mongodb instance
		time.sleep(.5)
		mongod.terminate()
		break

