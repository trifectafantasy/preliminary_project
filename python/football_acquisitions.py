##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def acquisitionValue(db, sport, year, owner_number):

	# set collection names
	collection_acquisition = "owner" + owner_number + "_" + sport + "_acquisitions_" + year
	collection_display = "owner" + owner_number + "_" + sport + "_acquisitions_display_" + year

	# remove blank and "header" players
	db[collection_acquisition].remove({"player": "OFFENSIVE PLAYER"})
	db[collection_acquisition].remove({"player": "KICKER"})
	db[collection_acquisition].remove({"player": "TEAM D/ST"})

	# clear acquisisiton display collection
	db[collection_display].remove({})

	# set list of acquisition weights with pick 1 having greatest weight
	number_of_draft_picks = db[sport + "_draft_" + year].count()
	acquisition_weight_chart = range(number_of_draft_picks, 0, -1)

	# pull acquisitions collection per owner
	acquisition_list = list(db[collection_acquisition].find({}, {"_id": 0}))
	#print acquisition_list

	# iterate through each player
	for each_player in acquisition_list:
		#print each_player

		insert_json = OrderedDict()

		# define a player and draft value (number or N/A)
		player = each_player["player"]
		acquired = each_player["acquired"]
		draft_position = each_player["draft_position"]

		# if player has REC then player at least played
		try:	
			REC = each_player["REC"]

		except KeyError:
			print each_player
			print "no rec"

			draft_position = each_player["draft_position"]

			# calculate acuisition weight
			if draft_position == "N/A":
				acquisition_weight = 1.5
			else:
				acquisition_weight = float(acquisition_weight_chart[draft_position - 1]) / 10 / 1.5

			if acquisition_weight < 1.5:
				acquisition_weight = 1.5

			insert_json["player"] = each_player["player"]

			# if player has no PTS, then straight 0's for everything but acquisition weight
			try:
				PTS = each_player["PTS"]
			except KeyError:
				print "no pts"

				insert_json["PTS"] = 0.0
				insert_json["acquired"] = each_player["acquired"]
				insert_json["draft_position"] = each_player["draft_position"]				
				insert_json["acquisition_weight"] = acquisition_weight
				insert_json["acquisition_value"] = 0.0
				insert_json["PASS"] = "0/0"
				insert_json["PASS_YDS"] = 0
				insert_json["PASS_TD"] = 0
				insert_json["PASS_INT"] = 0
				insert_json["RUSH"] = 0
				insert_json["RUSH_YDS"] = 0
				insert_json["RUSH_TD"] = 0
				insert_json["REC"] = 0
				insert_json["REC_YDS"] = 0
				insert_json["REC_TD"] = 0
				insert_json["REC_TAR"] = 0
				insert_json["MISC_FUML"] = 0
				insert_json["MISC_TD"] = 0

				db[collection_display].insert(insert_json)
				continue				

			# if player has PTS and thus acquisition value
			PTS = each_player["PTS"]
			acquisition_value = round(PTS / acquisition_weight, 2)
			insert_json["PTS"] = PTS
			insert_json["acquired"] = each_player["acquired"]
			insert_json["draft_position"] = each_player["draft_position"]				
			insert_json["acquisition_weight"] = acquisition_weight
			insert_json["acquisition_value"] = acquisition_value
			insert_json["PASS"] = "0/0"
			insert_json["PASS_YDS"] = 0
			insert_json["PASS_TD"] = 0
			insert_json["PASS_INT"] = 0
			insert_json["RUSH"] = 0
			insert_json["RUSH_YDS"] = 0
			insert_json["RUSH_TD"] = 0
			insert_json["REC"] = 0
			insert_json["REC_YDS"] = 0
			insert_json["REC_TD"] = 0
			insert_json["REC_TAR"] = 0
			insert_json["MISC_FUML"] = 0
			insert_json["MISC_TD"] = 0

			db[collection_display].insert(insert_json)
			continue

		# if player has receptions, PTS, played games
		PTS = each_player["PTS"]

		# if player acquired via trade, no acquisition value
		if acquired == "Trade":
			acquisition_weight = "N/A"
			acquisition_value = "N/A"

		# if drafted or picked up
		else:
			# calculate acquisition weight
			if draft_position == "N/A":
				acquisition_weight = 1.5
			else:
				acquisition_weight = float(acquisition_weight_chart[draft_position - 1]) / 10 / 1.5

			if acquisition_weight < 1.5:
				acquisition_weight = 1.5
			#print acquisition_weight

			# if negative points multiply by acquisition weight to increase negativity
			if PTS < 0:
				acquisition_value = round(PTS * acquisition_weight, 2)
			else:
				acquisition_value = round(PTS / acquisition_weight, 2)
		#print acquisition_value

		insert_json["player"] = each_player["player"]
		insert_json["PTS"] = each_player["PTS"]
		insert_json["acquired"] = each_player["acquired"]
		insert_json["draft_position"] = each_player["draft_position"]
		insert_json["acquisition_weight"] = acquisition_weight
		insert_json["acquisition_value"] = acquisition_value
		insert_json["PASS"] = each_player["PASS"]
		insert_json["PASS_YDS"] = each_player["PASS_YDS"]
		insert_json["PASS_TD"] = each_player["PASS_TD"]
		insert_json["PASS_INT"] = each_player["PASS_INT"]
		insert_json["RUSH"] = each_player["RUSH"]
		insert_json["RUSH_YDS"] = each_player["RUSH_YDS"]
		insert_json["RUSH_TD"] = each_player["RUSH_TD"]
		insert_json["REC"] = each_player["REC"]
		insert_json["REC_YDS"] = each_player["REC_YDS"]
		insert_json["REC_TD"] = each_player["REC_TD"]
		insert_json["REC_TAR"] = each_player["REC_TAR"]
		insert_json["MISC_FUML"] = each_player["MISC_FUML"]
		insert_json["MISC_TD"] = each_player["MISC_TD"]	

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
