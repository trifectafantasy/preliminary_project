##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys

##### DEFINE FUNCTIONS #####

# call everytime after you re-pull each team homepage to make sure team name hasn't changed
# function that goes through each owner collection, pulls all of the team names for that 
def createCollection(db):

	# set number of owners
	number_of_owners = 10

	for owner_num in range(1, number_of_owners + 1):

		# create each owner collection (e.g.: owner1, owner2)
		owner_collection = "owner" + str(owner_num)
		# pull each owner name from owner collection
		owner_name = list(db[owner_collection].find({}, {"owner": 1, "_id": 0}))[0]
		#print owner_name["owner"]

		# pull all team names under each owner
		team_names = list(db[owner_collection].find({}, {"teams": 1, "_id": 0}))[0]
		team_names_list = team_names["teams"]
		#print team_names_list

		# loop through each team name to add to "owners_per_team_name" database
		for each_team_name in team_names_list:
			#print each_team_name

			# create dictionary path through each_team_name
			path = "teams." + each_team_name
			#print path

			# add to collection dictionary of form: {team name: owner name} all inside teams dictionary
			db["owners_per_team_name"].update({}, {"$set": {path: owner_name}})

		#print ""

##### PYTHON SCRIPT TO EXECUTE #####

# in a subprocess, open mongodb connection
mongod = subprocess.Popen(["mongod"])
time.sleep(2)

# connect to MongoDB
try:
	client = MongoClient('mongodb://localhost:27017')
	print "Successful connection"

except pymongo.errors.ConnectionFailure, e:
	print "Count not connect to MongoDB: %s" % e

# use collection 'espn'
db = client.espn

# clear and initialize owners_per_team_name collection
db["owners_per_team_name"].remove({});
db["owners_per_team_name"].insert({"teams":{}})

createCollection(db)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()