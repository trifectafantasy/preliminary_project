##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### PYTHON SCRIPT TO EXECUTE #####

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

# while loop and try block to handle ^C KeyboardInterrupt to end program
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

	# handle KeyboardInterrupt and terminate mongod instance
	except KeyboardInterrupt:
		print "Goodbye"
		break

