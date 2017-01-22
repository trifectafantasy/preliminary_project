##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function to sort and give trifecta points based on h2h win percentage
# takes in argument of which MongoDB collection to use: 'baseball_2015_h2h'
def combine_databases(db, collection_h2h, collection_roto, collection_playoffs, year):

	collection_trifecta = "baseball_trifecta_" + year
	trifecta_upload = []

	db[collection_trifecta].remove({})

	pull_h2h = list(db[collection_h2h].find({}, {"team": 1, "h2h_trifecta_points": 1, "_id": 0}))
	

	for i in range(len(pull_h2h)):

		json = OrderedDict()

		team_name = pull_h2h[i]["team"]
		h2h_trifecta_points = pull_h2h[i]["h2h_trifecta_points"]
		h2h_trifecta_points = float(h2h_trifecta_points) / 2

		pull_roto = list(db[collection_roto].find({"team": team_name}, {"roto_trifecta_points": 1, "_id": 0}))
		roto_trifecta_points = pull_roto[0]["roto_trifecta_points"]
		roto_trifecta_points = float(roto_trifecta_points) / 2

		pull_playoffs = list(db[collection_playoffs].find({"team": team_name}, {"playoff_trifecta_points": 1, "_id": 0}))
		playoff_trifecta_points = pull_playoffs[0]["playoff_trifecta_points"]

		#print team_name
		#print h2h_trifecta_points
		#print playoff_trifecta_points

		season_trifecta_points = h2h_trifecta_points + roto_trifecta_points

		total_trifecta_points = season_trifecta_points + playoff_trifecta_points

		#print total_trifecta_points

		json["team"] = team_name
		json["h2h_trifecta_points"] = h2h_trifecta_points
		json["roto_trifecta_points"] = roto_trifecta_points
		json["season_trifecta_points"] = season_trifecta_points
		json["playoff_trifecta_points"] = playoff_trifecta_points
		json["total_trifecta_points"] = total_trifecta_points

		trifecta_upload.append(json)

	db[collection_trifecta].insert(trifecta_upload)

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

# define collections to be used
year = str(sys.argv[1])
collection_h2h = "baseball_h2h_" + year
collection_roto = "baseball_roto_" + year
collection_playoffs = "baseball_playoffs_" + year


combine_databases(db, collection_h2h, collection_roto, collection_playoffs, year)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()