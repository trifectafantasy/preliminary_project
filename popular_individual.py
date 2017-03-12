##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

def mostPopularPlayer(db, sport, year, owner_number):

	collection = sport + "_popular_" + year

	# pull particular owner's popular collection (list of all players involved in transactions)
	all_players_pull = list(db[collection].find({"owner_number": owner_number}, {"_id": 0}))
	all_players_list = all_players_pull[0]["all_players"]
	#print all_players_list

	# initialize variables
	popular_player_list = []
	max_count = 0

	# loop and count how many times player was involved in transaction
	for each_player in all_players_list:
		this_count = all_players_list.count(each_player)

		# if player has most transactions to date, set new max_count and reset and add player to list
		if this_count > max_count:
			max_count = this_count
			popular_player_list = []
			popular_player_list.append(each_player)
		# if player has tied most transactions to date, add player to list
		elif this_count == max_count:
			popular_player_list.append(each_player)
	# player with most transactions gets added to list that many times, so clear duplicates			
	unique_popular_player_list = list(set(popular_player_list))

	print unique_popular_player_list, max_count, "transactions"

	# clear document per owner number in popular database
	db[collection].remove({"owner_number": owner_number})

	# pull owner name
	owner = list(db["owner" + owner_number].find({}, {"_id": 0}))[0]["owner"]

	if sport == "football":

		# initialize variables
		popular_player_pr_list = []
		initial_PTS = 0

		# if more than one player with most transactions for team
		if len(unique_popular_player_list) > 1:
			for each_popular_player in unique_popular_player_list:

				# pull points for each popular player and method acquired (to account for if player never played for team)
				PTS = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": each_popular_player}, {"PTS": 1, "acquired": 1, "_id":0}))
				# if can't find said player's stats because player never played for team
				if PTS == []:
					PTS = "Did not play"
				else:
					acquired = PTS[0]["acquired"]
					PTS = PTS[0]["PTS"]
					# if 0 points and drafted, then this player most likely never played for team
					if PTS == 0 and acquired == "Draft":
						PTS = "Did not play"
				#print each_popular_player, PTS, "PTS"

				insert_json = OrderedDict()
				insert_json["owner"] = owner
				insert_json["player"] = each_popular_player
				insert_json["transactions"] = max_count
				insert_json["PTS"] = PTS
				db[collection].insert(insert_json)
		else:
			# pull points for one most popular player and method acuired (to account for it player never played)
			PTS = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": unique_popular_player_list[0]}, {"PTS": 1, "acquired": 1, "_id":0}))
			# if can't find said player's stats because player never played for team
			if PTS == []:
				PTS = "Did not play"
			else:
				acquired = PTS[0]["acquired"]
				PTS = PTS[0]["PTS"]
				# if 0 points and drafted, then this player most likely never played for team
				if PTS == 0 and acquired == "Draft":
					PTS = "Did not play"				
			#print unique_popular_player_list[0], PTS, "PTS"

			insert_json = OrderedDict()
			insert_json["owner"] = owner
			insert_json["player"] = unique_popular_player_list[0]
			insert_json["transactions"] = max_count
			insert_json["PTS"] = PTS
			db[collection].insert(insert_json)

	elif sport == "basketball":

		# initialize variables
 		popular_player_pr_list = []
		initial_weighted_pr = 0

		# if more than one player with most transactions for team
		if len(unique_popular_player_list) > 1:
			for each_popular_player in unique_popular_player_list:

				# pull weighted_PR for each popular player and method and GP (to see if player never played for team)
				weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": each_popular_player}, {"weighted_PR": 1, "GP": 1, "_id":0}))
				# if can't find said player's stats because player never played for team
				if weighted_PR == []:
					weighted_PR = "Did not play"
				else:
					GP = weighted_PR[0]["GP"]
					weighted_PR = weighted_PR[0]["weighted_PR"]
					# if 0 PR and 0 GP then player never played for team
					if weighted_PR == 0 and GP == 0:
						weighted_PR = "Did not play"
				#print each_popular_player, weighted_PR, "PR"

				insert_json = OrderedDict()
				insert_json["owner"] = owner
				insert_json["player"] = each_popular_player
				insert_json["transactions"] = max_count
				insert_json["weighted_PR"] = weighted_PR
				db[collection].insert(insert_json)
		else:
			# pull weighted PR for one popular player and GP (to see if player never played for team)
			weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": unique_popular_player_list[0]}, {"weighted_PR": 1, "GP": 1, "_id":0}))
			# if can't find player's stats because player never played for team
			if weighted_PR == []:
				weighted_PR = "Did not play"
			else:
				GP = weighted_PR[0]["GP"]
				weighted_PR = weighted_PR[0]["weighted_PR"]
				# if 0 PR and 0 GP, then player never played for team
				if weighted_PR == 0 and GP == 0:
					weighted_PR = "Did not play"				
			#print unique_popular_player_list[0], weighted_PR, "PR"

			insert_json = OrderedDict()
			insert_json["owner"] = owner
			insert_json["player"] = unique_popular_player_list[0]
			insert_json["transactions"] = max_count
			insert_json["weighted_PR"] = weighted_PR
			db[collection].insert(insert_json)

	elif sport == "baseball":

		# initialize variables
		popular_player_pr_list = []
		initial_weighted_pr = 0

		# if more than one player with most transactions for team
		if len(unique_popular_player_list) > 1:
			for each_popular_player in unique_popular_player_list:

				# pull weighted PR for each popular player
				weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": each_popular_player}, {"weighted_PR": 1, "_id":0}))
				# if can't find said player's stats then because player never played for team
				if weighted_PR == []:
					weighted_PR = "Did not play"
				else:
					weighted_PR = weighted_PR[0]["weighted_PR"]
					# if no weighted PR then most likely never played for team (not for sure)
					if weighted_PR == 0:
						weighted_PR = "Did not play"
				#print each_popular_player, weighted_PR, "PR"

				insert_json = OrderedDict()
				insert_json["owner"] = owner
				insert_json["player"] = each_popular_player
				insert_json["transactions"] = max_count
				insert_json["weighted_PR"] = weighted_PR
				db[collection].insert(insert_json)
		else:
			# pull weighted PR for one most popular player
			weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": unique_popular_player_list[0]}, {"weighted_PR": 1, "GP": 1, "_id":0}))
			# if can't find player's stats because player never played for team
			if weighted_PR == []:
				weighted_PR = "Did not play"
			else:
				weighted_PR = weighted_PR[0]["weighted_PR"]
				# if no weighted PR then most likely never played for team (not for sure)
				if weighted_PR == 0:
					weighted_PR = "Did not play"				
			#print unique_popular_player_list[0], weighted_PR, "PR"
			
			insert_json = OrderedDict()
			insert_json["owner"] = owner
			insert_json["player"] = unique_popular_player_list[0]
			insert_json["transactions"] = max_count
			insert_json["weighted_PR"] = weighted_PR
			db[collection].insert(insert_json)


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
sport = str(sys.argv[1])
year = str(sys.argv[2])
owner_number = str(sys.argv[3])

mostPopularPlayer(db, sport, year, owner_number)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()