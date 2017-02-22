##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function to sort and give trifecta points based on h2h win percentage
def combine_databases(db, collection_h2h, collection_roto, collection_playoffs, year):

	# set name of trifecta collection
	collection_trifecta = "basketball_trifecta_" + year
	trifecta_upload = []

	# clear trifecta if it already exists
	db[collection_trifecta].remove({})

	# pull names and h2h trifecta points from h2h collection
	pull_h2h = list(db[collection_h2h].find({}, {"team": 1, "h2h_trifecta_points": 1, "_id": 0}))

	for i in range(len(pull_h2h)):

		# make ordered dictionary for input into MongoDB
		json = OrderedDict()

		team_name = pull_h2h[i]["team"]
		
		# pull h2h points 
		h2h_trifecta_points = pull_h2h[i]["h2h_trifecta_points"]
		#h2h_trifecta_points = float(h2h_trifecta_points) / 2
		h2h_trifecta_points = float(h2h_trifecta_points)

		# pull roto trifecta points from roto collection
		# *** not in use right now *** #
		pull_roto = list(db[collection_roto].find({"team": team_name}, {"roto_trifecta_points": 1, "_id": 0}))
		roto_trifecta_points = pull_roto[0]["roto_trifecta_points"]
		roto_trifecta_points = roto_trifecta_points / 2

		# pull playoff trifecta points from playoffs collection
		pull_playoffs = list(db[collection_playoffs].find({"team": team_name}, {"playoff_trifecta_points": 1, "_id": 0}))
		playoff_trifecta_points = pull_playoffs[0]["playoff_trifecta_points"]

		#print team_name
		#print h2h_trifecta_points
		#print playoff_trifecta_points

		# regular season points are just h2h points
		#season_trifecta_points = h2h_trifecta_points + roto_trifecta_points
		season_trifecta_points = h2h_trifecta_points

		# total trifecta points are regular season plus playoffs
		total_trifecta_points = season_trifecta_points + playoff_trifecta_points
		#print total_trifecta_points

		# add values into ordered dictionary
		json["team"] = team_name
		#json["h2h_trifecta_points"] = h2h_trifecta_points
		#json["roto_trifecta_points"] = roto_trifecta_points
		json["season_trifecta_points"] = season_trifecta_points
		json["playoff_trifecta_points"] = playoff_trifecta_points
		json["total_trifecta_points"] = total_trifecta_points

		# append to list for upload
		trifecta_upload.append(json)

	# upload all to trifecta collection
	db[collection_trifecta].insert(trifecta_upload)

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

# define collections to be used
year = str(sys.argv[1])
collection_h2h = "basketball_h2h_" + year
collection_roto = "basketball_roto_" + year
collection_playoffs = "basketball_playoffs_" + year


combine_databases(db, collection_h2h, collection_roto, collection_playoffs, year)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()