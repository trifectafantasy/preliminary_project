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

def add_team_name_function(db, owner_number, team_name):
	# define collections to be used
	collection_owner = "owner" + owner_number
	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	print "Owner:", owner_name
	print team_name

	# update team names per owner
	db[collection_owner].update({}, {"$addToSet":{"teams": team_name}})
	print "Name added"

	print "Updating team names per owner collection..."
	# from owners_per_team python script, run createCollection function
	owners_per_team.createCollection(db)

# pull input for script from POST request
owner_number = str(sys.argv[1])
team_name = str(sys.argv[2])

