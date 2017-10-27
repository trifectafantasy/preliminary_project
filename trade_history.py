##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import pymongo
import subprocess
import time
import sys
from collections import OrderedDict


def tradeHistory(db, sport, year):

	collection_trade_history = sport + "_trade_history_" + year
	collection_trade_history_all = sport + "_trade_history_" + year + "_all"

	db[collection_trade_history_all].remove({})

	sport_trade_history_numbers = list(db[collection_trade_history].find({}, {"trade_number": 1, "_id": 0}).sort([("date", -1), ("trade_number", 1)]))
	number_of_sports_trades = sport_trade_history_numbers[-1]["trade_number"]
	#print number_of_sports_trades

	# pull list of players for each trade number
	for trade_number in range(1, number_of_sports_trades + 1):

		one_trade = list(db[collection_trade_history].find({"trade_number": trade_number}, {"_id": 0}).sort([("owner_number", 1)]))
		#print one_trade

		date = one_trade[0]["date"]
		#print date

		# reset owner and insert_json for each trade
		owner = ""
		insert_json = OrderedDict()

		# for each player for each trade
		# also get index of each array
		for index, players_in_trade in enumerate(one_trade):

			#print players_in_trade

			# get owner number and owner name (a little more complicated for football with different owner numbers)
			if players_in_trade["sport"] == "football":

				collection_football_owners = "football_owners"
				football_owner_number = int(players_in_trade["owner_number"])
				football_owners_pull = list(db[collection_football_owners].find({"football_owner_number": football_owner_number}, {"_id": 0}))
				
				owner_number = football_owners_pull[0]["owner_number"]
				owner_number = str(owner_number)[0:-2]
				#print owner_number, type(owner_number)

			else:
				owner_number = players_in_trade["owner_number"]

			#print owner_number

			collection_owner = "owner" + owner_number
			owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]

			# if owner is not same as owner_name
			# happens at first when "" != owner_name and when owners change in the middle
			if (owner != owner_name):

				# if it's the first time owner and owner_name are different (ie immediately, when index ==0)
				if (index == 0):
					insert_json["date"] = date
					insert_json["owner1"] = owner_name
				# when owners change and not the first tiime, add player list to insert_json and set owner2 name
				else:
					insert_json["owner1_players"] = ", ".join(player_list)
					insert_json["owner2"] = owner_name

				# reset player_list and add players to list
				player_list = []

				player = players_in_trade["player"]
				player_list.append(player)

				# change owner_name to functioning looping owner
				owner = owner_name

			# if it's the same owner, just add player to the list
			else:
				player = players_in_trade["player"]
				player_list.append(player)

		# when all players have been processed, add player_list to json
		insert_json["owner2_players"] = ", ".join(player_list)

		print insert_json
		print ""

		db[collection_trade_history_all].insert(insert_json)

		collection_all = "trade_history"
		db[collection_all].insert(insert_json)


##### PYTHON SCRIPT TO EXECUTE #####

# connect to MongoDB
try:
	client = MongoClient('mongodb://localhost:27017')
	print "Successful connection"

except pymongo.errors.ConnectionFailure, e:
	print "Count not connect to MongoDB: %s" % e

# use collection 'espn'
db = client.espn

# define collections to be used
sport = str(sys.argv[1])
year = str(sys.argv[2])


tradeHistory(db, sport, year)
