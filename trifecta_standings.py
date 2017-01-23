##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys

##### DEFINE FUNCTIONS #####

# function to sort and give trifecta points based on h2h win percentage
def trifectaSeasonPoints(db, season):

	collection_season_trifecta = "trifecta_" + season
	db[collection_season_trifecta].remove({})

	collection_football = "football_trifecta_" + season[0:4]
	collection_basketball = "basketball_trifecta_" + season[5:9]
	collection_baseball = "baseball_trifecta_" + season[5:9]

	number_of_owners = 10

	for owner_num in range(1, number_of_owners + 1):

		# create each owner collection (e.g.: owner1, owner2)
		owner_collection = "owner" + str(owner_num)
		# pull each owner name from owner collection
		owner = list(db[owner_collection].find({}, {"owner": 1, "_id": 0}))[0]
		owner_name = owner["owner"]
		#print "owner: ", owner_name

		football_list = list(db[collection_football].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}))
		
		for football_info in football_list:
			football_team = football_info["team"]
			football_points = football_info["total_trifecta_points"]
			#print football_team

			path = "teams." + football_team

			owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
			#print owner_check
			owner_name_check = owner_check["teams"][football_team]["owner"]
			#print owner_name_check

			if owner_name == owner_name_check:
				correct_team_name = football_team
				correct_trifecta_points = football_points

		football_trifecta_points = correct_trifecta_points
		#print "football team name: ", correct_team_name
		#print "football trifecta points: ", football_trifecta_points
		
		basketball_list = list(db[collection_basketball].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}))
		
		for basketball_info in basketball_list:
			basketball_team = basketball_info["team"]
			basketball_points = basketball_info["total_trifecta_points"]
			#print basketball_team

			path = "teams." + basketball_team

			owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
			#print owner_check
			owner_name_check = owner_check["teams"][basketball_team]["owner"]
			#print owner_name_check

			if owner_name == owner_name_check:
				correct_team_name = basketball_team
				correct_trifecta_points = basketball_points

		basketball_trifecta_points = correct_trifecta_points
		#print "basketball team name: ", correct_team_name
		#print "basketball trifecta points: ", basketball_trifecta_points
		
		baseball_list = list(db[collection_baseball].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}))
		
		for baseball_info in baseball_list:
			baseball_team = baseball_info["team"]
			baseball_points = baseball_info["total_trifecta_points"]
			#print baseball_team

			path = "teams." + baseball_team

			owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
			#print owner_check
			owner_name_check = owner_check["teams"][baseball_team]["owner"]
			#print owner_name_check

			if owner_name == owner_name_check:
				correct_team_name = baseball_team
				correct_trifecta_points = baseball_points

		baseball_trifecta_points = correct_trifecta_points
		#print "baseball team name: ", correct_team_name
		#print "baseball trifecta points: ", baseball_trifecta_points		

		print ""

		total_trifecta_points = football_trifecta_points + basketball_trifecta_points + baseball_trifecta_points

		input_json = {
		"owner": owner_name,
		"football": football_trifecta_points,
		"basketball": basketball_trifecta_points,
		"baseball": baseball_trifecta_points,
		"total_trifecta_points": total_trifecta_points
		}

		print input_json

		#db[collection_season_trifecta].insert(input_json)



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
season = str(sys.argv[1])


trifectaSeasonPoints(db, season)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()