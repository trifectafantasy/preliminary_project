##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def basketballTrade(db, sport, year):

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

			owner_number = player_pull["owner_number"]
			owner_name = list(db["owner" + owner_number].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
			#print owner_name

			collection_stat = "owner" + owner_number + "_" + sport +  "_stats_" + year

			player_name = player_pull["player"]

			stat_pull = list(db[collection_stat].find({"player": player_name}, {"_id": 0}))[0]
			#print stat_pull

			insert_json["trade_number"] = trade_number
			insert_json["owner_number"] = owner_number
			insert_json["owner"] = owner_name
			insert_json["player"] = player_name
			insert_json["GP"] = stat_pull["GP"]
			insert_json["FG"] = stat_pull["FG"]
			insert_json["FG_PCT"] = stat_pull["FG_PCT"]
			insert_json["FT"] = stat_pull["FT"]
			insert_json["FT_PCT"] = stat_pull["FT_PCT"]
			insert_json["THREEPM"] = stat_pull["THREEPM"]
			insert_json["REB"] = stat_pull["REB"]
			insert_json["AST"] = stat_pull["AST"]
			insert_json["STL"] = stat_pull["STL"]
			insert_json["BLK"] = stat_pull["BLK"]
			insert_json["TO"] = stat_pull["TO"]
			insert_json["PTS"] = stat_pull["PTS"]

			if owner_number not in owners_list:
				owners_list.append(owner_number)

			db[collection_trade].update({"trade_number": trade_number, "player": player_name}, insert_json)
			
		print owners_list

		for each_owner in owners_list:
			
			owner_name = list(db["owner" + each_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
			print "owner: ", owner_name

			total_pull = list(db[collection_trade].find({"trade_number": trade_number, "owner_number": each_owner}, {"_id": 0}))
			#print total_pull

			total_json = OrderedDict()

			GP_upload = 0
			FGA_upload = 0
			FGM_upload = 0
			FG_PCT_upload = 0
			FTA_upload = 0
			FTM_upload = 0
			FT_PCT_upload = 0
			THREEPM_upload = 0
			REB_upload = 0
			AST_upload = 0
			STL_upload = 0
			BLK_upload = 0
			TO_upload = 0
			PTS_upload = 0

			for each_player in total_pull:

				print each_player

				GP_upload += each_player["GP"]

				FG_pull = each_player["FG"]
				FG_index = FG_pull.index('/')
				FGM_upload += float(FG_pull[:FG_index])
				FGA_upload += float(FG_pull[FG_index + 1:])
				FG_PCT_upload = round(float(FGM_upload / FGA_upload), 4)
				FG_upload = str(int(FGM_upload)) + "/" + str(int(FGA_upload))

				FT_pull = each_player["FT"]
				FT_index = FT_pull.index('/')
				FTM_upload += float(FT_pull[:FT_index])
				FTA_upload += float(FT_pull[FT_index + 1:])
				FT_PCT_upload = round(float(FTM_upload / FTA_upload), 4)
				FT_upload = str(int(FTM_upload)) + '/' + str(int(FTA_upload))

				THREEPM_upload += each_player["THREEPM"]
				REB_upload += each_player["REB"]
				AST_upload += each_player["AST"]
				STL_upload += each_player["STL"]
				BLK_upload += each_player["BLK"]
				TO_upload += each_player["TO"]
				PTS_upload += each_player["PTS"]

			total_json["trade_number"] = trade_number
			total_json["owner_number"] = each_owner
			total_json["owner"] = owner_name
			total_json["player"] = "Total"
			total_json["GP"] = GP_upload
			total_json["FG"] = FG_upload
			total_json["FG_PCT"] = FG_PCT_upload
			total_json["FT"] = FT_upload
			total_json["FT_PCT"] = FT_PCT_upload
			total_json["THREEPM"] = THREEPM_upload
			total_json["REB"] = REB_upload
			total_json["AST"] = AST_upload
			total_json["STL"] = STL_upload
			total_json["BLK"] = BLK_upload
			total_json["TO"] = TO_upload
			total_json["PTS"] = PTS_upload

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


basketballTrade(db, sport, year)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()