##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def baseballTrade(db, sport, year):

	# pull all trades in collection
	collection_trade = sport + "_trades_" + year
	trade_list = list(db[collection_trade].find({}, {"trade_number": 1, "_id": 0}))
	#print trade_list

	number_of_trades = 0

	# count how many trades there are
	for trade_number_list in trade_list:
		trade_number_count = trade_number_list["trade_number"]

		if trade_number_count > number_of_trades:
			number_of_trades = trade_number_count
	#print number_of_trades

	# loop through each trade number
	for trade_number in range(1, number_of_trades + 1):

		# list of owners involved in this trade number
		owners_list = []	
		#print "trade number", trade_number

		# pull players in specific trade number
		trade_pull = list(db[collection_trade].find({"trade_number": trade_number}, {"player": 1, "owner_number": 1, "_id": 0}))
		#print trade_pull

		insert_json = OrderedDict()

		# loop through each player in this trade
		for player_pull in trade_pull:

			# pull owner number and owner name
			owner_number = player_pull["owner_number"]
			owner_name = list(db["owner" + owner_number].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
			#print owner_name

			player_name = player_pull["player"]

			# pull stats for this player
			collection_stat = "owner" + owner_number + "_" + sport +  "_stats_" + year
			stat_pull = list(db[collection_stat].find({"player": player_name}, {"_id": 0}))[0]
			#print stat_pull

			insert_json["trade_number"] = trade_number
			insert_json["owner_number"] = owner_number
			insert_json["owner"] = owner_name
			insert_json["player"] = player_name
			insert_json["GP"] = stat_pull["GP"]
			insert_json["AB"] = stat_pull["AB"]
			insert_json["H"] = stat_pull["H"]
			insert_json["R"] = stat_pull["R"]
			insert_json["HR"] = stat_pull["HR"]
			insert_json["RBI"] = stat_pull["RBI"]
			insert_json["BB"] = stat_pull["BB"]
			insert_json["SO"] = stat_pull["SO"]
			insert_json["SB"] = stat_pull["SB"]
			insert_json["OBP"] = stat_pull["OBP"]
			insert_json["IP"] = stat_pull["IP"]
			insert_json["HA"] = stat_pull["HA"]
			insert_json["ER"] = stat_pull["ER"]
			insert_json["BBA"] = stat_pull["BBA"]
			insert_json["K"] = stat_pull["K"]
			insert_json["QS"] = stat_pull["QS"]
			insert_json["W"] = stat_pull["W"]
			insert_json["SV"] = stat_pull["SV"]
			insert_json["ERA"] = stat_pull["ERA"]
			insert_json["WHIP"] = stat_pull["WHIP"]

			# add player to owner list of owners involved in trade
			if owner_number not in owners_list:
				owners_list.append(owner_number)

			db[collection_trade].update({"trade_number": trade_number, "player": player_name}, insert_json)
			
		#print owners_list

		# for each owner in each trade number to sum
		for each_owner in owners_list:
			
			# pull owner name
			owner_name = list(db["owner" + each_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
			#print "owner: ", owner_name

			# pull stats per trade number and owner
			total_pull = list(db[collection_trade].find({"trade_number": trade_number, "owner_number": each_owner}, {"_id": 0}))
			#print total_pull

			total_json = OrderedDict()

			GP_upload = 0
			AB_upload = 0
			H_upload = 0
			R_upload = 0
			HR_upload = 0
			RBI_upload = 0
			BB_upload = 0
			SO_upload = 0
			SB_upload = 0
			OBP_upload = 0.0
			IP_upload = 0.0
			HA_upload = 0
			ER_upload = 0
			BBA_upload = 0
			K_upload = 0
			QS_upload = 0
			W_upload = 0
			SV_upload = 0
			ERA_upload = 0.0
			WHIP_upload = 0.0

			# for each player per owner and trade number
			for each_player in total_pull:
				#print each_player

				# sum to totals
				GP_upload += each_player["GP"]
				AB_upload += each_player["AB"]
				H_upload += each_player["H"]
				R_upload += each_player["R"]
				HR_upload += each_player["HR"]
				RBI_upload += each_player["RBI"]
				BB_upload += each_player["BB"]
				SO_upload += each_player["SO"]
				SB_upload += each_player["SB"]
				# calculate OBP
				if AB_upload + BB_upload == 0:
					OBP_upload += 0.0
				else:
					OBP_upload = float(H_upload + BB_upload) / float(AB_upload + BB_upload)

				# convert 1/3 and 2/3 of innings for IP
				IP_upload += each_player["IP"]
				if ".3" in str(IP_upload):
					IP_upload = IP_upload - 0.3 + 1

				elif ".4" in str(IP_upload):
					IP_upload + IP_upload - 0.3 + 1

				HA_upload += each_player["HA"]
				ER_upload += each_player["ER"]
				BBA_upload += each_player["BBA"]
				K_upload += each_player["K"]
				QS_upload += each_player["QS"]
				W_upload += each_player["W"]
				SV_upload += each_player["SV"]

				# convert to 1/3 and 2/3 IP and use for ERA and WHIP calculations
				if ".1" in str(IP_upload):
					IP_calc = IP_upload - 0.1 + 0.33333
				elif ".2" in str(IP_upload):
					IP_calc = IP_upload - 0.2 + 0.66666
				else:
					IP_calc = IP_upload

				if (IP_calc == 0):
					ERA_upload = 0
				else:
					ERA_upload = (9 * ER_upload) / (IP_calc)

				if (IP_calc == 0):
					WHIP_upload = 0
				else:
					WHIP_upload = (HA_upload + BBA_upload) / (IP_calc)

			total_json["trade_number"] = trade_number
			total_json["owner_number"] = each_owner
			total_json["owner"] = owner_name
			total_json["player"] = "zzTotal"
			total_json["GP"] = GP_upload
			total_json["AB"] = AB_upload
			total_json["H"] = H_upload
			total_json["R"] = R_upload
			total_json["HR"] = HR_upload
			total_json["RBI"] = RBI_upload
			total_json["BB"] = BB_upload
			total_json["SO"] = SO_upload
			total_json["SB"] = SB_upload
			total_json["OBP"] = OBP_upload
			total_json["IP"] = IP_upload
			total_json["HA"] = HA_upload
			total_json["ER"] = ER_upload
			total_json["BBA"] = BBA_upload
			total_json["K"] = K_upload
			total_json["QS"] = QS_upload
			total_json["W"] = W_upload
			total_json["SV"] = SV_upload
			total_json["ERA"] = ERA_upload
			total_json["WHIP"] = WHIP_upload

			db[collection_trade].insert(total_json)			

				
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


baseballTrade(db, sport, year)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()