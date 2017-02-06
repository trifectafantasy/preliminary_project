##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def acquisitionValue(db, sport, year, owner_number):

	collection_acquisition = "owner" + owner_number + "_" + sport + "_acquisitions_" + year

	db[collection_acquisition].remove({"player":""})

	acquisition_value_chart = range(230, 0, -1)
	#print acquisition_value_chart

	acquisition_list = list(db[collection_acquisition].find({}, {"_id": 0}))
	#print acquisition_list

	for each_player in acquisition_list:
		#print each_player

		insert_json = OrderedDict()

		player = each_player["player"]
		acquired = each_player["acquired"]
		draft_position = each_player["draft_position"]

		try:
			PR = each_player["PR"]
		except KeyError:
			print "no PR"

			if acquired == "Trade":

				acquisition_weight = "N/A"
				acquisition_value = "N/A"

			else:

				if draft_position == "N/A":
					acquisition_weight = 1.5
				else:
					acquisition_weight = round(float(acquisition_value_chart[draft_position - 1]) / 10 / 1.5, 2)

				if acquisition_weight < 1.5:
					acquisition_weight = 1.5

			insert_json["player"] = player
			insert_json["weighted_PR"] = 0.0
			insert_json["acquired"] = each_player["acquired"]
			insert_json["draft_position"] = each_player["draft_position"]
			insert_json["acquisition_weight"] = acquisition_weight
			insert_json["acquisition_value"] = 0.0
			insert_json["PR"] = "N/A"
			insert_json["GP"] = 0
			insert_json["AB"] = 0
			insert_json["H"] = 0
			insert_json["R"] = 0
			insert_json["HR"] = 0
			insert_json["RBI"] = 0
			insert_json["BB"] = 0
			insert_json["SO"] = 0
			insert_json["SB"] = 0
			insert_json["OBP"] = 0.0000

			db[collection_acquisition].update({"player": player}, insert_json)
			continue

		try:
			IP = each_player["IP"]
		except KeyError:
			print "hitter"

			PR = each_player["PR"]
			GP = each_player["GP"]				

			if acquired == "Trade":

				acquisition_weight = "N/A"
				acquisition_value = "N/A"
				weighted_PR = round(PR * GP, 2)

			else:

				if draft_position == "N/A":
					acquisition_weight = 1.5
				else:
					acquisition_weight = round(float(acquisition_value_chart[draft_position - 1]) / 10 / 1.5, 2)

				if acquisition_weight < 1.5:
					acquisition_weight = 1.5

				weighted_PR = round(PR * GP, 2)
				acquisition_value = round(weighted_PR / acquisition_weight, 2)

			insert_json["player"] = player
			insert_json["weighted_PR"] = weighted_PR
			insert_json["acquired"] = each_player["acquired"]
			insert_json["draft_position"] = each_player["draft_position"]
			insert_json["acquisition_weight"] = acquisition_weight
			insert_json["acquisition_value"] = acquisition_value
			insert_json["PR"] = PR
			insert_json["GP"] = GP	
			insert_json["AB"] = each_player["AB"]
			insert_json["H"] = each_player["H"]
			insert_json["R"] = each_player["R"]
			insert_json["HR"] = each_player["HR"]
			insert_json["RBI"] = each_player["RBI"]
			insert_json["BB"] = each_player["BB"]
			insert_json["SO"] = each_player["SO"]
			insert_json["SB"] = each_player["SB"]
			insert_json["OBP"] = each_player["OBP"]

			db[collection_acquisition].update({"player": player}, insert_json)
			continue			

		try:
			GP = each_player["GP"]
		except KeyError:
			print "pitcher"			

			PR = each_player["PR"]
			IP = each_player["IP"]				

			if acquired == "Trade":

				acquisition_weight = "N/A"
				acquisition_value = "N/A"
				weighted_PR = round(PR * IP, 2)

			else:

				if draft_position == "N/A":
					acquisition_weight = 1.5
				else:
					acquisition_weight = round(float(acquisition_value_chart[draft_position - 1]) / 10 / 1.5, 2)

				if acquisition_weight < 1.5:
					acquisition_weight = 1.5

				weighted_PR = round(PR * IP, 2)
				acquisition_value = round(weighted_PR / acquisition_weight, 2)

			insert_json["player"] = player
			insert_json["weighted_PR"] = weighted_PR
			insert_json["acquired"] = each_player["acquired"]
			insert_json["draft_position"] = each_player["draft_position"]
			insert_json["acquisition_weight"] = acquisition_weight
			insert_json["acquisition_value"] = acquisition_value
			insert_json["PR"] = PR
			insert_json["IP"] = IP
			insert_json["HA"] = each_player["HA"]
			insert_json["BBA"] = each_player["BBA"]
			insert_json["K"] = each_player["K"]
			insert_json["QS"] = each_player["QS"]
			insert_json["W"] = each_player["W"] 
			insert_json["SV"] = each_player["SV"]
			insert_json["ERA"] = each_player["ERA"]
			insert_json["WHIP"] = each_player["WHIP"]

			db[collection_acquisition].update({"player": player}, insert_json)
			continue

		print insert_json
		#print ""

		db[collection_acquisition].update({"player": player}, insert_json)
		

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
sport = str(sys.argv[1])
year = str(sys.argv[2])
owner_number = str(sys.argv[3])


acquisitionValue(db, sport, year, owner_number)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()