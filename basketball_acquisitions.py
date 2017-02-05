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

	acquisition_value_chart = range(140, 0, -1)
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
			GP = each_player["GP"]
		except KeyError:
			print "no GP"

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

			insert_json["player"] = each_player["player"]
			insert_json["weighted_PR"] = 0.0
			insert_json["acquired"] = each_player["acquired"]
			insert_json["draft_position"] = each_player["draft_position"]
			insert_json["acquisition_weight"] = acquisition_weight
			insert_json["acquisition_value"] = 0.0
			insert_json["PR"] = "N/A"
			insert_json["GP"] = 0
			insert_json["FG"] = "0/0"
			insert_json["FG_PCT"] = 0.0000
			insert_json["FT"] = "0/0"
			insert_json["FT_PCT"] = 0.0000
			insert_json["THREEPM"] = 0
			insert_json["REB"] = 0
			insert_json["AST"] = 0
			insert_json["STL"] = 0
			insert_json["BLK"] = 0
			insert_json["TO"] = 0
			insert_json["PTS"] = 0
			
			db[collection_acquisition].update({"player": player}, insert_json)
			continue



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

		insert_json["player"] = each_player["player"]
		insert_json["weighted_PR"] = weighted_PR
		insert_json["acquired"] = each_player["acquired"]
		insert_json["draft_position"] = each_player["draft_position"]
		insert_json["acquisition_weight"] = acquisition_weight
		insert_json["acquisition_value"] = acquisition_value
		insert_json["PR"] = PR
		insert_json["GP"] = GP
		insert_json["FG"] = each_player["FG"]
		insert_json["FG_PCT"] = each_player["FG_PCT"]
		insert_json["FT"] = each_player["FT"]
		insert_json["FT_PCT"] = each_player["FT_PCT"]
		insert_json["THREEPM"] = each_player["THREEPM"]
		insert_json["REB"] = each_player["REB"]
		insert_json["AST"] = each_player["AST"]
		insert_json["STL"] = each_player["STL"]
		insert_json["BLK"] = each_player["BLK"]
		insert_json["TO"] = each_player["TO"]
		insert_json["PTS"] = each_player["PTS"]

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