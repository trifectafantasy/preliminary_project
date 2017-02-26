##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict
import math

##### DEFINE FUNCTIONS #####


# function that combines data from all matchup collections for total season trifecta owner matchup standings
def profilePlayers(db, owner_number, sport, year):

	print sport, year
	year = str(year)


	if sport == "football":

		insert_json = OrderedDict()
		MVP_pull = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({}, {"player": 1, "PTS": 1, "acquired": 1, "draft_position": 1, "acquisition_value": 1, "_id": 0}).sort("PTS", -1))
		MVP = MVP_pull[0]
		print MVP

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["award"] = "MVP"
		insert_json["player"] = MVP["player"]
		insert_json["score"] = MVP["PTS"]
		insert_json["acquired"] = MVP["acquired"]
		insert_json["draft_position"] = MVP["draft_position"]
		insert_json["acquisition_value"] = MVP["acquisition_value"]

		print insert_json
		db["owner" + owner_number + "_profile_players"].insert(insert_json)

		insert_json = OrderedDict()
		value_pull = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({}, {"player": 1, "PTS": 1, "acquired": 1, "draft_position": 1, "acquisition_value": 1, "_id": 0}).sort([("acquisition_value", -1), ("acquisition_weight", 1)]))

		while value_pull[0]["acquisition_value"] == "N/A":
			remover = value_pull.pop(0)
			#print "removed", remover
		#print value_pull

		best_value = value_pull[0]
		#print best_value

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["award"] = "Best Value Player"
		insert_json["player"] = best_value["player"]
		insert_json["score"] = best_value["PTS"]
		insert_json["acquired"] = best_value["acquired"]
		insert_json["draft_position"] = best_value["draft_position"]
		insert_json["acquisition_value"] = best_value["acquisition_value"]

		print insert_json 
		db["owner" + owner_number + "_profile_players"].insert(insert_json)

		insert_json = OrderedDict()
		while math.isnan(value_pull[-1]["acquisition_value"]) == True:
			remover = value_pull.pop()
			#print "removed", remover
		#print value_pull

		worst_value = value_pull[-1]
		#print worst_value

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["award"] = "Worst Value Player"
		insert_json["player"] = worst_value["player"]
		insert_json["score"] = worst_value["PTS"]
		insert_json["acquired"] = worst_value["acquired"]
		insert_json["draft_position"] = worst_value["draft_position"]
		insert_json["acquisition_value"] = worst_value["acquisition_value"]
		
		print insert_json 
		db["owner" + owner_number + "_profile_players"].insert(insert_json)

	else:

		insert_json = OrderedDict()
		MVP_pull = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({}, {"player": 1, "weighted_PR": 1, "acquired": 1, "draft_position": 1, "acquisition_value": 1, "_id": 0}).sort("weighted_PR", -1))
		MVP = MVP_pull[0]
		#print MVP
		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["award"] = "MVP"
		insert_json["player"] = MVP["player"]
		insert_json["score"] = MVP["weighted_PR"]
		insert_json["acquired"] = MVP["acquired"]
		insert_json["draft_position"] = MVP["draft_position"]
		insert_json["acquisition_value"] = MVP["acquisition_value"]

		print insert_json
		db["owner" + owner_number + "_profile_players"].insert(insert_json)


		insert_json = OrderedDict()
		value_pull = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({}, {"player": 1, "weighted_PR": 1, "acquired": 1, "draft_position": 1, "acquisition_value": 1, "_id": 0}).sort("acquisition_value", -1))
		#print value_pull

		while value_pull[0]["acquisition_value"] == "N/A":
			remover = value_pull.pop(0)
			#print "removed", remover
		#print value_pull

		best_value = value_pull[0]
		#print best_value
		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["award"] = "Best Value Player"
		insert_json["player"] = best_value["player"]
		insert_json["score"] = best_value["weighted_PR"]
		insert_json["acquired"] = best_value["acquired"]
		insert_json["draft_position"] = best_value["draft_position"]
		insert_json["acquisition_value"] = best_value["acquisition_value"]

		print insert_json 
		db["owner" + owner_number + "_profile_players"].insert(insert_json)


		insert_json = OrderedDict()
		while math.isnan(value_pull[-1]["acquisition_value"]) == True:
			remover = value_pull.pop()
			#print "removed", remover
		#print value_pull

		worst_value = value_pull[-1]
		#print worst_value
		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["award"] = "Worst Value Player"
		insert_json["player"] = worst_value["player"]
		insert_json["score"] = worst_value["weighted_PR"]
		insert_json["acquired"] = worst_value["acquired"]
		insert_json["draft_position"] = worst_value["draft_position"]
		insert_json["acquisition_value"] = worst_value["acquisition_value"]
		
		print insert_json 
		db["owner" + owner_number + "_profile_players"].insert(insert_json)		

	print ""



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
owner_number = str(sys.argv[1])
start_year = int(sys.argv[2])
end_year = int(sys.argv[3])
football_completed_season = str(sys.argv[4])
basketball_completed_season = str(sys.argv[5])
baseball_completed_season = str(sys.argv[6])

db["owner" + owner_number + "_profile_players"].remove({})

sports_list = ["football", "basketball", "baseball"]

start_year_list = range(start_year, end_year)
for year1 in start_year_list:
	year2 = year1 + 1

	if year2 == end_year:
		for sport in sports_list:
			if baseball_completed_season == "true":
				if sport == "football":
					year = year1
					profilePlayers(db, owner_number, sport, year)
				elif sport == "basketball":
					year = year2
					profilePlayers(db, owner_number, sport, year)
				elif sport == 'baseball':
					year = year2
					profilePlayers(db, owner_number, sport, year)
			elif basketball_completed_season == "true":
				if sport == "football":
					year = year1
					profilePlayers(db, owner_number, sport, year)
				elif sport == "basketball":
					year = year2
					profilePlayers(db, owner_number, sport, year)
			elif football_completed_season == "true":
				if sport == "football":
					year = year1
					profilePlayers(db, owner_number, sport, year)

	else:
		for sport in sports_list:
			if sport == "football":
				year = year1
				if year == 2015:
					print "Sorry, but no player analysis for Football 2015"
				else:
					profilePlayers(db, owner_number, sport, year)
			elif sport == "basketball":
				year = year2
				if year == 2016:
					print "Sorry, but no player analysis for Basketball 2016"
				else:
					profilePlayers(db, owner_number, sport, year)
			elif sport == "baseball":
				year = year2
				profilePlayers(db, owner_number, sport, year)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()