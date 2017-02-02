##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def footballTrade(db, sport, year):

	collection_trade = sport + "_trades_" + year

	trade_list = list(db[collection_trade].find({}, {"trade_number": 1, "_id": 0}))
	#print trade_list

	number_of_trades = 0


	for trade_number_list in trade_list:
		trade_number_count = trade_number_list["trade_number"]

		if trade_number_count != number_of_trades:
			number_of_trades = trade_number_count


	for trade_number in range(1, number_of_trades + 1):

		owners_list = []

		trade_pull = list(db[collection_trade].find({"trade_number": trade_number}, {"player": 1, "owner_number": 1, "_id": 0}))
		#print trade_pull
		
		insert_json = OrderedDict()

		for player_pull in trade_pull:

			football_owner_number = player_pull["owner_number"]
			#print football_owner_number

			real_owner = list(db["football_owners"].find({"football_owner_number": int(football_owner_number)}, {"owner_number": 1, "_id": 0}))[0]
			owner_number = str(int(real_owner["owner_number"]))
			#print owner_number

			owner_name = list(db["owner" + owner_number].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
			#print owner_name

			collection_stat = "owner" + owner_number + "_" + sport + "_stats_" + year

			player_name = player_pull["player"]
			#print player_name

			stat_pull = list(db[collection_stat].find({"player": player_name}, {"_id": 0}))
			#print stat_pull

			if stat_pull == []:
				insert_json["trade_number"] = trade_number
				insert_json["owner_number"] = owner_number
				insert_json["owner"] = owner_name
				insert_json["player"] = player_name
				insert_json["PTS"] = 0
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

			else: 

				insert_json["trade_number"] = trade_number
				insert_json["owner_number"] = owner_number
				insert_json["owner"] = owner_name
				insert_json["player"] = player_name
				insert_json["PTS"] = stat_pull[0]["PTS"]
				insert_json["PASS"] = stat_pull[0]["PASS"]
				insert_json["PASS_YDS"] = stat_pull[0]["PASS_YDS"]
				insert_json["PASS_TD"] = stat_pull[0]["PASS_TD"]
				insert_json["PASS_INT"] = stat_pull[0]["PASS_INT"]
				insert_json["RUSH"] = stat_pull[0]["RUSH"]
				insert_json["RUSH_YDS"] = stat_pull[0]["RUSH_YDS"]
				insert_json["RUSH_TD"] = stat_pull[0]["RUSH_TD"]
				insert_json["REC"] = stat_pull[0]["REC"]
				insert_json["REC_YDS"] = stat_pull[0]["REC_YDS"]
				insert_json["REC_TD"] = stat_pull[0]["REC_TD"]
				insert_json["REC_TAR"] = stat_pull[0]["REC_TAR"]
				insert_json["MISC_FUML"] = stat_pull[0]["MISC_FUML"]
				insert_json["MISC_TD"] = stat_pull[0]["MISC_TD"]

			if owner_number not in owners_list:
				owners_list.append(owner_number)

			db[collection_trade].update({"trade_number": trade_number, "player": player_name}, insert_json)
		
		#print owners_list
		
		for each_owner in owners_list:
			
			owner_name = list(db["owner" + each_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
			print "owner: ", owner_name

			total_pull = list(db[collection_trade].find({"trade_number": trade_number, "owner_number": each_owner}, {"_id": 0}))
			#print total_pull

			total_json = OrderedDict()

			C_upload = 0
			A_upload = 0
			PASS_YDS_upload = 0
			PASS_TD_upload = 0
			PASS_INT_upload = 0
			RUSH_upload = 0
			RUSH_YDS_upload = 0
			RUSH_TD_upload = 0
			REC_upload = 0
			REC_YDS_upload = 0
			REC_TD_upload = 0
			REC_TAR_upload = 0
			MISC_FUML_upload = 0
			MISC_TD_upload = 0
			PTS_upload = 0

			for each_player in total_pull:

				print each_player

				PASS_pull = each_player["PASS"]
				PASS_index = PASS_pull.index('/')
				C_upload += int(PASS_pull[:PASS_index])
				A_upload += int(PASS_pull[PASS_index + 1:])
				PASS_upload = str(C_upload) + "/" + str(A_upload)

				PASS_YDS_upload += each_player["PASS_YDS"]
				PASS_TD_upload += each_player["PASS_TD"]
				PASS_INT_upload += each_player["PASS_INT"]
				RUSH_upload += each_player["RUSH"]
				RUSH_YDS_upload += each_player["RUSH_YDS"]
				RUSH_TD_upload += each_player["RUSH_TD"]
				REC_upload += each_player["RUSH"]
				REC_YDS_upload += each_player["REC_YDS"]
				REC_TD_upload += each_player["REC_TD"]
				REC_TAR_upload += each_player["REC_TAR"]
				MISC_FUML_upload += each_player["MISC_FUML"]
				MISC_TD_upload += each_player["MISC_TD"]
				PTS_upload += each_player["PTS"]


			total_json["trade_number"] = trade_number
			total_json["owner_number"] = each_owner
			total_json["owner"] = owner_name
			total_json["player"] = "Total"
			total_json["PTS"] = PTS_upload
			total_json["PASS"] = PASS_upload
			total_json["PASS_YDS"] = PASS_YDS_upload
			total_json["PASS_TD"] = PASS_TD_upload
			total_json["PASS_INT"] = PASS_INT_upload
			total_json["RUSH"] = RUSH_upload
			total_json["RUSH_YDS"] = RUSH_YDS_upload
			total_json["RUSH_TD"] = RUSH_TD_upload
			total_json["REC"] = REC_upload
			total_json["REC_YDS"] = REC_YDS_upload
			total_json["REC_TD"] = REC_TD_upload
			total_json["REC_TAR"] = REC_TAR_upload
			total_json["MISC_FUML"] = MISC_FUML_upload
			total_json["MISC_TD"] = MISC_TD_upload


			db[collection_trade].insert(total_json)			
		

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


footballTrade(db, sport, year)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()