##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict
import math

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def acquisitionValue(db, sport, year, owner_number):

	# set acquisition collection name
	collection_acquisition = "owner" + owner_number + "_" + sport + "_acquisitions_" + year
	collection_display = "owner" + owner_number + "_" + sport + "_acquisitions_display_" + year

	db[collection_display].remove({})

	# set list of acquisition weights with pick 1 having greatest weight
	number_of_draft_picks = db[sport + "_draft_" + year].count()
	acquisition_weight_chart = range(number_of_draft_picks, 0, -1)
	#print acquisition_weight_chart	

	# pull acquisition collection
	acquisition_list = list(db[collection_acquisition].find({}, {"_id": 0}))
	#print acquisition_list

	# loop through each document in pull
	for each_player in acquisition_list:
		#print each_player

		insert_json = OrderedDict()

		player = each_player["player"]
		acquired = each_player["acquired"]
		draft_position = each_player["draft_position"]

		if len(each_player) == 4:
			PR = each_player["PR"]

			# if trade, set acquisition stats as N/A, but still calculate weighted PR
			if acquired == "Trade":
				acquisition_weight = "N/A"
				acquisition_value = "N/A"
				weighted_PR = 0.0

			# if drafted, find acquisition weight from chart then divide by 10, then base (1.5)
			else:
				if draft_position == "N/A":
					acquisition_weight = 1.5
				else:
					acquisition_weight = round(float(acquisition_weight_chart[draft_position - 1]) / 10 / 2 / 1.5, 2)

				if acquisition_weight < 1.5:
					acquisition_weight = 1.5

				weighted_PR = 0.0
				# if weighted PR < 0, multiply by acquisition weight
				if weighted_PR < 0:
					acquisition_value = round(weighted_PR * acquisition_weight, 2)
				else:
					acquisition_value = round(weighted_PR / acquisition_weight, 2)

			# add to ordered json for upload
			insert_json["player"] = player
			insert_json["hit_or_pit"] = "Pitcher"
			insert_json["weighted_PR"] = weighted_PR
			insert_json["acquired"] = each_player["acquired"]
			insert_json["draft_position"] = each_player["draft_position"]
			insert_json["acquisition_weight"] = acquisition_weight
			insert_json["acquisition_value"] = acquisition_value
			insert_json["PR"] = PR
			insert_json["IP"] = 0
			insert_json["HA"] = 0
			insert_json["BBA"] = 0
			insert_json["K"] = 0
			insert_json["QS"] = 0
			insert_json["W"] = 0
			insert_json["SV"] = 0
			insert_json["ERA"] = 0.000
			insert_json["WHIP"] = 0.000

			print insert_json

			db[collection_display].insert(insert_json)
			continue

		# try and pull PR
		try:
			PR = each_player["PR"]
		# if error
		except KeyError:
			print "no PR"

			# if no PR, then it's a trade, set acquisition stats as N/A
			if acquired == "Trade":
				acquisition_weight = "N/A"
				acquisition_value = "N/A"

			else:
				# if undrafted, weight is 1.5
				if draft_position == "N/A":
					acquisition_weight = 1.5
				# if drafted, take drafted acquisition weight from chart, divide by 10 then 1.5 (minimum)
				else:
					acquisition_weight = round(float(acquisition_weight_chart[draft_position - 1]) / 10 / 2 / 1.5, 2)
				# can't have an acquisition weight less than 1.5
				if acquisition_weight < 1.5:
					acquisition_weight = 1.5

			# set ordered json to insert (with all 0's for player with N/A)
			insert_json["player"] = player
			insert_json["hit_or_pit"] = "Hitter/Pitcher"
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

			print insert_json

			db[collection_display].insert(insert_json)
			continue

		# try to pull IP
		try:
			IP = each_player["IP"]
		# if can't, hitter
		except KeyError:
			print "hitter"

			PR = each_player["PR"]
			GP = each_player["GP"]	
			if math.isnan(GP):
				GP = 0			

			# if trade, set acquisition stats as N/A, but still calculate weighted PR
			if acquired == "Trade":
				acquisition_weight = "N/A"
				acquisition_value = "N/A"
				weighted_PR = round(PR * GP, 2)

			# if drafted, find acquisition weight from chart then divide by 10, then base (1.5)
			else:
				if draft_position == "N/A":
					acquisition_weight = 1.5
				else:
					acquisition_weight = round(float(acquisition_weight_chart[draft_position - 1]) / 10 / 2 / 1.5, 2)

				if acquisition_weight < 1.5:
					acquisition_weight = 1.5

				weighted_PR = round(PR * GP, 2)
				# if weighted PR < 0, multiply by acquisition weight
				if weighted_PR < 0:
					acquisition_value = round(weighted_PR * acquisition_weight, 2)
				else:
					acquisition_value = round(weighted_PR / acquisition_weight, 2)

			# add to ordered json for upload
			insert_json["player"] = player
			insert_json["hit_or_pit"] = "Hitter"
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

			print insert_json

			db[collection_display].insert(insert_json)
			continue			

		# try to pull GP
		try:
			GP = each_player["GP"]
		# if can't, pitcher
		except KeyError:
			print "pitcher"			

			PR = each_player["PR"]
			IP = each_player["IP"]	
			if math.isnan(IP):
				IP = 0
				
			if ".1" in str(IP):
				IP_calc = round(IP,0) + 0.33
			elif ".2" in str(IP):
				IP_calc = round(IP,0) + 0.67
			else:
				IP_calc = IP

			# if trade, set acquisition stats as N/A, but still calculate weighted PR
			if acquired == "Trade":
				acquisition_weight = "N/A"
				acquisition_value = "N/A"
				weighted_PR = round(PR * IP_calc / 2, 2)

			# if drafted, find acquisition weight from chart then divide by 10, then base (1.5)
			else:
				if draft_position == "N/A":
					acquisition_weight = 1.5
				else:
					acquisition_weight = round(float(acquisition_weight_chart[draft_position - 1]) / 10 / 2 / 1.5, 2)

				if acquisition_weight < 1.5:
					acquisition_weight = 1.5

				weighted_PR = round(PR * IP_calc / 2, 2)
				# if weighted PR < 0, multiply by acquisition weight
				if weighted_PR < 0:
					acquisition_value = round(weighted_PR * acquisition_weight, 2)
				else:
					acquisition_value = round(weighted_PR / acquisition_weight, 2)

			# add to ordered json for upload
			insert_json["player"] = player
			insert_json["hit_or_pit"] = "Pitcher"
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

			print insert_json
			db[collection_display].insert(insert_json)
			continue

		#print insert_json
		#print ""

		db[collection_display].insert(insert_json)
		

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
owner_number = str(sys.argv[3])

acquisitionValue(db, sport, year, owner_number)
