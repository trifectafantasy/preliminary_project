##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that per season, finds player that's been on most teams and find owners who owned them
def mostTeams(db, sport, year):

	# clear "all" owner document from popular database
	collection_popular = sport + "_popular_" + year
	db[collection_popular].remove({"owner": "all"})

	# pull all acquisitions which has stats for every player for every team
	collection_acquisitions = sport + "_acquisitions_display_" + year + "_all"
	all_player_pull = list(db[collection_acquisitions].find({}, {"player": 1, "owner": 1, "_id": 0}))
	#print all_player_pull

	all_players_list = []

	# add each player to a list
	for each_dict in all_player_pull:
		all_players_list.append(each_dict["player"])
	#print all_players_list

	# initialize variables for counting
	popular_player_list = []
	max_count = 0

	# looping through every player and count how many times that player appears in all player list
	for each_player in all_players_list:
		this_count = all_players_list.count(each_player)

		# if player has most teams been on to date, set new max_count and reset and add player to list
		if this_count > max_count:
			max_count = this_count
			popular_player_list = []
			popular_player_list.append(each_player)
		# if player has tied most transactions to date, add player to list
		elif this_count == max_count:
			popular_player_list.append(each_player)
	# player with most transactions gets added to list that many times, so clear duplicates			
	unique_popular_player_list = list(set(popular_player_list))

	print unique_popular_player_list, max_count, "teams"

	# loop through each most popular player to find corresponding owners
	for each_popular_player in unique_popular_player_list:
		owner_dict = OrderedDict()
		owner_dict["owner"] = "all"
		owner_dict["player"] = each_popular_player
		owner_dict["owners"] = []

		# loop through all players
		for owner_find in all_player_pull:
			# if correct player, add owner
			if owner_find["player"] == each_popular_player:
				owner_dict["owners"].append(owner_find["owner"])

		print owner_dict
		db[collection_popular].insert(owner_dict)


##### PYTHON SCRIPT TO EXECUTE #####

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
