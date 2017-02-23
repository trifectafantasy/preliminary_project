##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict
import math

##### DEFINE FUNCTIONS #####

def	profileMatchupsTrifecta(db, owner_number, year1, year2):

	insert_json = OrderedDict()
	
	year1 = str(year1)
	year2 = str(year2)

	trifecta_pull = list(db["owner" + owner_number + "_trifecta_matchups_" + year1 + "_" + year2].find({}, {"opposing_owner": 1, "total_win_per": 1, "_id": 0}).sort("total_win_per", -1))
	#print trifecta_pull

	best_against = trifecta_pull[0]
	#print "best against", best_against

	worst_against = trifecta_pull[-1]
	#print "worst against", worst_against

	insert_json["season"] = "Trifecta " + year1 + " " + year2
	insert_json["best_owner"] = best_against["opposing_owner"]
	insert_json["best_win_per"] = best_against["total_win_per"]
	insert_json["best_pt_diff"] = "N/A"
	insert_json["worst_owner"] = worst_against["opposing_owner"]
	insert_json["worst_win_per"] = worst_against["total_win_per"]
	insert_json["worst_pt_diff"] = "N/A"

	db["owner" + owner_number + "_profile_matchups"].insert(insert_json)
 
# function that gets the trifecta standings
def	profileMatchups(db, owner_number, sport, year1, year2):

	insert_json = OrderedDict()

	#print sport
	#print year1, year2
	year1 = str(year1)
	year2 = str(year2)

	if sport == "football":
		year = year1
		sport_pull = list(db["owner" + owner_number + "_" + sport + "_matchups_" + year].find({}, {"win_per": 1, "pt_diff": 1, "opposing_owner": 1, "_id": 0}).sort([("win_per", -1), ("pt_diff", -1)]))
		
		best_against = sport_pull[0]
		#print "best against", best_against
		worst_against = sport_pull[-1]
		#print "worst against", worst_against

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["best_owner"] = best_against["opposing_owner"]
		insert_json["best_win_per"] = best_against["win_per"]
		insert_json["best_pt_diff"] = best_against["pt_diff"]
		insert_json["worst_owner"] = worst_against["opposing_owner"]
		insert_json["worst_win_per"] = worst_against["win_per"]
		insert_json["worst_pt_diff"] = worst_against["pt_diff"]		

	elif sport == "basketball":
		year = year2
		sport_pull = list(db["owner" + owner_number + "_" + sport + "_matchups_" + year].find({}, {"win_per": 1, "opposing_owner": 1, "_id": 0}).sort([("win_per", -1), ("wins", -1)]))
		
		best_against = sport_pull[0]
		#print "best against", best_against
		worst_against = sport_pull[-1]
		#print "worst against", worst_against

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["best_owner"] = best_against["opposing_owner"]
		insert_json["best_win_per"] = best_against["win_per"]
		insert_json["best_pt_diff"] = "N/A"
		insert_json["worst_owner"] = worst_against["opposing_owner"]
		insert_json["worst_win_per"] = worst_against["win_per"]
		insert_json["worst_pt_diff"] = "N/A"

	elif sport == "baseball":
		year = year2
		sport_pull = list(db["owner" + owner_number + "_" + sport + "_matchups_" + year].find({}, {"win_per": 1, "opposing_owner": 1, "_id": 0}).sort([("win_per", -1), ("wins", -1)]))
		
		best_against = sport_pull[0]
		#print "best against", best_against
		worst_against = sport_pull[-1]
		#print "worst against", worst_against

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["best_owner"] = best_against["opposing_owner"]
		insert_json["best_win_per"] = best_against["win_per"]
		insert_json["best_pt_diff"] = "N/A"
		insert_json["worst_owner"] = worst_against["opposing_owner"]
		insert_json["worst_win_per"] = worst_against["win_per"]
		insert_json["worst_pt_diff"] = "N/A"

	print insert_json
	print ""

	db["owner" + owner_number + "_profile_matchups"].insert(insert_json)

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

db["owner" + owner_number + "_profile_matchups"].remove({})

sports_list = ["football", "basketball", "baseball"]

start_year_list = range(start_year, end_year)
for year1 in start_year_list:
	year2 = year1 + 1

	if year2 == end_year:
		for sport in sports_list:
			if baseball_completed_season == "true":
				if sport == "football":
					profileMatchups(db, owner_number, sport, year1, year2)
				elif sport == "basketball":
					profileMatchups(db, owner_number, sport, year1, year2)
				elif sport == 'baseball':
					profileMatchups(db, owner_number, sport, year1, year2)
			elif basketball_completed_season == "true":
				if sport == "football":
					profileMatchups(db, owner_number, sport, year1, year2)
				elif sport == "basketball":
					profileMatchups(db, owner_number, sport, year1, year2)
			elif football_completed_season == "true":
				if sport == "football":
					profileMatchups(db, owner_number, sport, year1, year2)

	else:
		for sport in sports_list:
			if sport == "football":
				profileMatchups(db, owner_number, sport, year1, year2)
			elif sport == "basketball":
				profileMatchups(db, owner_number, sport, year1, year2)
			elif sport == "baseball":
				profileMatchups(db, owner_number, sport, year1, year2)

				profileMatchupsTrifecta(db, owner_number, year1, year2)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()