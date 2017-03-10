##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

def mostPopularPlayer(db, sport, year, owner_number):

	collection = sport + "_popular_" + year

	all_players_pull = list(db[collection].find({"owner_number": owner_number}, {"_id": 0}))
	all_players_list = all_players_pull[0]["all_players"]
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

	print unique_popular_player_list, max_count, "transactions"

	db[collection].remove({"owner_number": owner_number})

	owner = list(db["owner" + owner_number].find({}, {"_id": 0}))[0]["owner"]

	if sport == "football":

		popular_player_pr_list = []
		initial_PTS = 0
		if len(unique_popular_player_list) > 1:
			for each_popular_player in unique_popular_player_list:
				PTS = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": each_popular_player}, {"PTS": 1, "acquired": 1, "_id":0}))
				if PTS == []:
					PTS = "Did not play"
				else:
					acquired = PTS[0]["acquired"]
					PTS = PTS[0]["PTS"]
					if PTS == 0 and acquired == "Draft":
						PTS = "Did not play"
				#print each_popular_player, PTS, "PR"
				insert_json = OrderedDict()
				insert_json["owner"] = owner
				insert_json["player"] = each_popular_player
				insert_json["transactions"] = max_count
				insert_json["PTS"] = PTS
				db[collection].insert(insert_json)
		else:
			PTS = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": unique_popular_player_list[0]}, {"PTS": 1, "acquired": 1, "_id":0}))
			if PTS == []:
				PTS = "Did not play"
			else:
				acquired = PTS[0]["acquired"]
				PTS = PTS[0]["PTS"]
				if PTS == 0 and acquired == "Draft":
					PTS = "Did not play"				
			#print unique_popular_player_list[0], weighted_PR, "PR"
			insert_json = OrderedDict()
			insert_json["owner"] = owner
			insert_json["player"] = unique_popular_player_list[0]
			insert_json["transactions"] = max_count
			insert_json["PTS"] = PTS
			db[collection].insert(insert_json)

	elif sport == "basketball":

 		popular_player_pr_list = []
		initial_weighted_pr = 0
		if len(unique_popular_player_list) > 1:
			for each_popular_player in unique_popular_player_list:
				weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": each_popular_player}, {"weighted_PR": 1, "GP": 1, "_id":0}))
				if weighted_PR == []:
					weighted_PR = "Did not play"
				else:
					GP = weighted_PR[0]["GP"]
					weighted_PR = weighted_PR[0]["weighted_PR"]
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
			weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": unique_popular_player_list[0]}, {"weighted_PR": 1, "GP": 1, "_id":0}))
			if weighted_PR == []:
				weighted_PR = "Did not play"
			else:
				GP = weighted_PR[0]["GP"]
				weighted_PR = weighted_PR[0]["weighted_PR"]
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
		popular_player_pr_list = []
		initial_weighted_pr = 0
		if len(unique_popular_player_list) > 1:
			for each_popular_player in unique_popular_player_list:
				weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": each_popular_player}, {"weighted_PR": 1, "_id":0}))
				if weighted_PR == []:
					weighted_PR = "Did not play"
				else:
					weighted_PR = weighted_PR[0]["weighted_PR"]
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
			weighted_PR = list(db["owner" + owner_number + "_" + sport + "_acquisitions_display_" + year].find({"player": unique_popular_player_list[0]}, {"weighted_PR": 1, "GP": 1, "_id":0}))
			if weighted_PR == []:
				weighted_PR = "Did not play"
			else:
				weighted_PR = weighted_PR[0]["weighted_PR"]
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