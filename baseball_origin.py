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

	collection_acquisition = "owner" + owner_number + "_" + sport + "_acquisitions_" + year
	collection_origin = sport + "_origin_" + year
	collection_owner = "owner" + owner_number

	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	#print owner_name

	db[collection_acquisition].remove({"player": ""})

	db[collection_origin].remove({"owner": owner_name})

	hitter_draft_pr = 0.0
	hitter_fa_pr = 0.0
	hitter_trade_pr = 0.0
	hitter_total_pr = 0.0	

	pitcher_draft_pr = 0.0
	pitcher_fa_pr = 0.0
	pitcher_trade_pr = 0.0
	pitcher_total_pr = 0.0

	draft_pr = 0.0
	fa_pr = 0.0
	trade_pr = 0.0
	total_pr = 0.0	

	acquisition_list = list(db[collection_acquisition].find({}, {"_id": 0}))
	#print acquisition_list

	# loop through each document in pull
	for each_player in acquisition_list:
		print each_player
		
		print "hitter_total_pr", hitter_total_pr
		print "hitter draft_pr", hitter_draft_pr
		print "hitter fa pr", hitter_fa_pr
		print "hitter trade pr", hitter_trade_pr
		print "pitcher_total_pr", pitcher_total_pr
		print "pitcher draft pr", pitcher_draft_pr
		print "pitcher fa pr", pitcher_fa_pr
		print "pitcher trade pr", pitcher_trade_pr
		print "total pr", total_pr
		

		insert_json = OrderedDict()

		player = each_player["player"]
		acquired = each_player["acquired"]

		# try and pull PR
		try:
			PR = each_player["PR"]
		# if error
		except KeyError:
			PR = 0.0
			weighted_pr = 0.0
			print ""
			continue

		if len(each_player) == 4:
			continue

		# try to pull IP
		try:
			IP = each_player["IP"]
		# if can't, hitter
		except KeyError:
			#print "hitter"

			if math.isnan(each_player["GP"]) == True:
				continue			

			try:
				GP = each_player["GP"]
			except KeyError:
				weighted_pr = 0.0
				print ""
				continue

			PR = each_player["PR"]
			GP = each_player["GP"]
			weighted_pr = PR * GP
			print "weighted pr", weighted_pr


			if acquired == "Draft":
				hitter_draft_pr += weighted_pr

			elif acquired == "FA":
				hitter_fa_pr += weighted_pr

			elif acquired == "Trade":
				hitter_trade_pr += weighted_pr

			hitter_total_pr += weighted_pr
			total_pr = hitter_total_pr + pitcher_total_pr


			print ""
			continue			

		# try to pull GP
		try:
			GP = each_player["GP"]
		# if can't, pitcher
		except KeyError:
			#print "pitcher"

			if math.isnan(each_player["IP"]) == True:
				continue		

			try:
				IP = each_player["IP"]
			except KeyError:
				weighted_pr = 0.0
				print ""
				continue		

			PR = each_player["PR"]
			IP = each_player["IP"]				
			weighted_pr = PR * IP
			print "weighted pr", weighted_pr


			if acquired == "Draft":
				pitcher_draft_pr += weighted_pr

			elif acquired == "FA":
				pitcher_fa_pr += weighted_pr

			elif acquired == "Trade":
				pitcher_trade_pr += weighted_pr

			pitcher_total_pr += weighted_pr
			total_pr = hitter_total_pr + pitcher_total_pr


			print ""
			continue

	hitter_draft_pct = hitter_draft_pr / hitter_total_pr * 100
	hitter_fa_pct = hitter_fa_pr / hitter_total_pr * 100
	hitter_trade_pct = hitter_trade_pr / hitter_total_pr * 100

	pitcher_draft_pct = pitcher_draft_pr / pitcher_total_pr * 100
	pitcher_fa_pct = pitcher_fa_pr / pitcher_total_pr * 100
	pitcher_trade_pct = pitcher_trade_pr / pitcher_total_pr * 100

	draft_pr = hitter_draft_pr + pitcher_draft_pr
	fa_pr = hitter_fa_pr + pitcher_fa_pr
	trade_pr = hitter_trade_pr + pitcher_trade_pr

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

	insert_json["hitter_total_pr"] = round(hitter_total_pr, 1)
	insert_json["hitter_draft_pct"] = round(hitter_draft_pct, 1)
	insert_json["hitter_fa_pct"] = round(hitter_fa_pct, 1)
	insert_json["hitter_trade_pct"] = round(hitter_trade_pct, 1)
	insert_json["hitter_draft_pr"] = round(hitter_draft_pr, 1)
	insert_json["hitter_fa_pr"] = round(hitter_fa_pr, 1)
	insert_json["hitter_trade_pr"] = round(hitter_trade_pr, 1)	

	insert_json["pitcher_total_pr"] = round(pitcher_total_pr, 1)
	insert_json["pitcher_draft_pct"] = round(pitcher_draft_pct, 1)
	insert_json["pitcher_fa_pct"] = round(pitcher_fa_pct, 1)
	insert_json["pitcher_trade_pct"] = round(pitcher_trade_pct, 1)
	insert_json["pitcher_draft_pr"] = round(pitcher_draft_pr, 1)
	insert_json["pitcher_fa_pr"] = round(pitcher_fa_pr, 1)
	insert_json["pitcher_trade_pr"] = round(pitcher_trade_pr, 1)

	print insert_json
	result = db[collection_origin].insert_one(insert_json)
	print result.inserted_id


		

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