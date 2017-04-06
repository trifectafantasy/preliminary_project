##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict
import owners_per_team

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

print "-----Add Team Names per Owner-----"

# while loop and try block to handle ^C KeyboardInterrupt to end program
while True:
	try:

		owner_number = raw_input("Owner Number: ")
		# define collections to be used
		collection_owner = "owner" + owner_number
		owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
		print "Owner:", owner_name
		team_name = raw_input("New Team Name: ")
		print team_name

		# update team names per owner
		db[collection_owner].update({}, {"$addToSet":{"teams": team_name}})

		print "Name added"
		print ""

	# handle KeyboardInterrupt and terminate mongod instance
	except KeyboardInterrupt:
		print "Updating team names per owner collection..."
		owners_per_team.createCollection(db)
		print "Goodbye"
		break

