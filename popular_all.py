##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

def mostTeams(db, sport, year):

	collection_popular = sport + "_popular_" + year
	db[collection_popular].remove({"owner": "all"})
	collection_acquisitions = sport + "_acquisitions_display_" + year + "_all"

	all_player_pull = list(db[collection_acquisitions].find({}, {"player": 1, "owner": 1, "_id": 0}))
	#print all_player_pull

	all_players_list = []

	for each_dict in all_player_pull:
		all_players_list.append(each_dict["player"])
	#print all_players_list

	popular_player_list = []
	max_count = 0
	for each_player in all_players_list:
		this_count = all_players_list.count(each_player)
		if this_count > max_count:
			max_count = this_count
			popular_player_list = []
			popular_player_list.append(each_player)
		elif this_count == max_count:
			popular_player_list.append(each_player)
	unique_popular_player_list = list(set(popular_player_list))

	print unique_popular_player_list, max_count, "teams"

	for each_popular_player in unique_popular_player_list:
		owner_dict = OrderedDict()
		owner_dict["owner"] = "all"
		owner_dict["player"] = each_popular_player
		owner_dict["owners"] = []

		for owner_find in all_player_pull:
			if owner_find["player"] == each_popular_player:
				owner_dict["owners"].append(owner_find["owner"])

		print owner_dict
		db[collection_popular].insert(owner_dict)


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

# use collection_acquisitions 'espn'
db = client.espn

sport = str(sys.argv[1])
year = str(sys.argv[2])

mostTeams(db, sport, year)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()