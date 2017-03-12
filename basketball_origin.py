##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict
import math

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def originCalculation(db, sport, year, owner_number):

	# name collections
	collection_acquisition = "owner" + owner_number + "_" + sport + "_acquisitions_" + year
	collection_origin = sport + "_origin_" + year
	collection_owner = "owner" + owner_number

	# pull owner name
	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	#print owner_name

	# clear any blank owners
	db[collection_acquisition].remove({"player": ""})

	# clear this owner's origin collection before new calculation
	db[collection_origin].remove({"owner": owner_name})

	# pull players and acquisition values
	acquisition_list = list(db[collection_acquisition].find({}, {"_id": 0}))
	#print acquisition_list

	# initialize counting variables
	draft_pr = 0.0
	fa_pr = 0.0
	trade_pr = 0.0

	total_pr = 0.0

	# for each player's stats
	for each_player in acquisition_list:
		insert_json = OrderedDict()
		#print each_player

		player = each_player["player"]
		acquired = each_player["acquired"]
		
		# try to pull PR, if can't PR = 0
		try:
			each_player["PR"]
		except KeyError:
			PR = 0.0
			weighted_pr = 0.0
			continue

		# try to pull GP, if no GP. GP & weighted_PR = 0
		try:
			each_player["GP"]
		except KeyError:
			GP = 0
			weighted_pr = 0.0
			continue

		PR = each_player["PR"]
		GP = each_player["GP"]

		# if GP is Nan
		if math.isnan(GP) == True:
			GP = 0

		weighted_pr = PR * GP

		# depending on method of acquisition, add to that total
		if acquired == "Draft":
			draft_pr += weighted_pr
		elif acquired == "FA":
			fa_pr += weighted_pr
		elif acquired == "Trade":
			trade_pr += weighted_pr

		total_pr += weighted_pr

	# calculate percentages
	draft_pct = draft_pr / total_pr * 100
	fa_pct = fa_pr / total_pr * 100
	trade_pct = trade_pr / total_pr * 100

	insert_json["owner"] = owner_name
	insert_json["total_pr"] = round(total_pr, 1)
	insert_json["draft_pct"] = round(draft_pct, 1)
	insert_json["fa_pct"] = round(fa_pct, 1)
	insert_json["trade_pct"] = round(trade_pct, 1)
	insert_json["draft_pr"] = round(draft_pr, 1)
	insert_json["fa_pr"] = round(fa_pr, 1)
	insert_json["trade_pr"] = round(trade_pr, 1)

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