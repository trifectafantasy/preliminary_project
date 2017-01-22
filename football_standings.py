##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys

##### DEFINE FUNCTIONS #####

# function to sort and give trifecta points based on h2h win percentage
# takes in argument of which MongoDB collection to use: 'football_2015_h2h'
def combine_databases(db, collection_h2h, collection_roto):

	pull_teams = list(db[collection_h2h].find({}, {"team": 1, "_id": 0}))
	for i in range(len(pull_teams)):
		team_name = pull_teams[i]["team"]

		other_categories = ["PF", "PA"]

		for category in other_categories:

			pull_other = list(db[collection_roto].find({"team": team_name}, {category: 1, "_id": 0}))
			print pull_other
			input_value = pull_other[0][category]
			db[collection_h2h].update({"team": team_name}, {"$set": {category: float(input_value)}})

def trifecta_points(db, collection): 

	sorted_record = list(db[collection].find({}, {"team": 1, "win_per": 1, "PF": 1, "_id": 0}).sort("win_per", -1))
	###print sorted_record

	trifecta_points = 10

	deserves_more = False

	for i in range(len(sorted_record)):

		current_team = sorted_record[i]["team"]
		current_team_win_per = sorted_record[i]["win_per"]
		current_team_PF = sorted_record[i]["PF"]

		individual_trifecta_points = 0



		if i + 1 == len(sorted_record):
			if deserves_more == False:
				individual_trifecta_points = trifecta_points
			else:
				individual_trifecta_points = trifecta_points + 1
		else:
			if deserves_more == True:
				individual_trifecta_points = trifecta_points + 1
				deserves_more = False

			for j in range(i + 1, len(sorted_record)):

				other_team = sorted_record[j]["team"]
				other_team_win_per = sorted_record[j]["win_per"]
				other_team_PF = sorted_record[j]["PF"]

				if current_team_win_per == other_team_win_per:

					print "Tie in win %!"

					if current_team_PF > other_team_PF:

						individual_trifecta_points = trifecta_points
						deserves_more = False

					elif current_team_PF == other_team_PF:
						print "TIE IN BOTH WIN % AND PF!!!!!"

					else:
						individual_trifecta_points = trifecta_points - 1
						deserves_more = True
				else:
					if individual_trifecta_points == 0:
							individual_trifecta_points = trifecta_points

		trifecta_points -= 1

		print "Team:", current_team
		print "Trifecta points", individual_trifecta_points

		db[collection].update({"team": current_team}, {"$set": {"trifecta_points": individual_trifecta_points}})


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
collection_h2h = "football_h2h_" + year
collection_roto = "football_roto_" + year

combine_databases(db, collection_h2h, collection_roto)
trifecta_points(db, collection_h2h)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()