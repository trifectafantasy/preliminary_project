##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def originCalculation(db, sport, year, owner_number):

	# set collection names
	collection_acquisition = "owner" + owner_number + "_" + sport + "_acquisitions_" + year
	collection_origin = sport + "_origin_" + year
	collection_owner = "owner" + owner_number

	# pull owner name
	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	#print owner_name

	# delete header and empty "players" 
	db[collection_acquisition].remove({"player": "OFFENSIVE PLAYER"})
	db[collection_acquisition].remove({"player": "KICKER"})
	db[collection_acquisition].remove({"player": "TEAM D/ST"})
	db[collection_acquisition].remove({"player": ""})

	# clear origin database for particular owner
	db[collection_origin].remove({"owner": owner_name})

	# pull acquisition database
	acquisition_list = list(db[collection_acquisition].find({}, {"_id": 0}))
	#print acquisition_list

	# initailize counting variables
	draft_points = 0.0
	fa_points = 0.0
	trade_points = 0.0

	total_points = 0.0

	# loop through each player who has stats
	for each_player in acquisition_list:
		insert_json = OrderedDict()
		#print each_player

		# set player and method acquired
		player = each_player["player"]
		acquired = each_player["acquired"]
		
		# if can't pul PTS, set as 0
		try:
			each_player["PTS"]
		except KeyError:
			PTS = 0.0
			continue

		PTS = each_player["PTS"]

		# depending on method of acquisition, add to that method total
		if acquired == "Draft":
			draft_points += PTS
		elif acquired == "FA":
			fa_points += PTS
		elif acquired == "Trade":
			trade_points += PTS

		# add to total total
		total_points += PTS

	# calculate percentages for eaech method of acquisition
	draft_pct = draft_points / total_points * 100
	fa_pct = fa_points / total_points * 100
	trade_pct = trade_points / total_points * 100

	insert_json["owner"] = owner_name
	insert_json["total_points"] = round(total_points, 1)
	insert_json["draft_pct"] = round(draft_pct, 1)
	insert_json["fa_pct"] = round(fa_pct, 1)
	insert_json["trade_pct"] = round(trade_pct, 1)
	insert_json["draft_points"] = round(draft_points, 1)
	insert_json["fa_points"] = round(fa_points, 1)
	insert_json["trade_points"] = round(trade_points, 1)

	print insert_json
	db[collection_origin].insert(insert_json)


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


originCalculation(db, sport, year, owner_number)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()