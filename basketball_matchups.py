##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that creates a trifecta season-long standings based on however much data is available for each sport
def matchupRecords(db, year, owner_number):

	collection_owner_matchups = "owner" + owner_number + "_basketball_matchups_" + year
	db[collection_owner_matchups].remove({})

	collection_owner_matchups_scrape = "owner" + owner_number + "_basketball_matchups_scrape_" + year
	matchups_total_list = list(db[collection_owner_matchups_scrape].find({}, {"_id": 0}))
	#print matchups_total_list

	completed_opposing_owners_list = []

	for matchup in matchups_total_list:
		wins = 0.0
		losses = 0.0
		ties = 0.0

		insert_json = OrderedDict()

		opposing_owner = matchup["opposing_owner"]
		record = matchup["record"]
		print "opposing owner: ", opposing_owner
		print "record: ", record

		dash_index = record.index("-")
		wins = float(record[:dash_index])
		print "wins: ", wins

		new_record = record[dash_index + 1:]
		#print new_record
		dash_index = record.index("-")
		losses = float(new_record[:dash_index])
		print "losses: ", losses

		ties = float(new_record[dash_index + 1:])
		print "ties: ", ties

		if opposing_owner not in completed_opposing_owners_list:
			print "new opposing owner"

			win_per = (wins + (ties / 2)) / (wins + losses + ties)

			insert_json["opposing_owner"] = opposing_owner
			insert_json["wins"] = wins
			insert_json["losses"] = losses
			insert_json["ties"] = ties
			insert_json["win_per"] = round(win_per, 3)

			#print insert_json

			db[collection_owner_matchups].insert(insert_json)
			
			completed_opposing_owners_list.append(opposing_owner)
			


		else:
			print "old owner"
			old_owner_pull_list = list(db[collection_owner_matchups].find({"opposing_owner": opposing_owner}, {"wins": 1, "losses": 1, "ties": 1, "win_per": 1, "_id": 0}))
			wins_pull = old_owner_pull_list[0]["wins"]
			losses_pull = old_owner_pull_list[0]["losses"]
			ties_pull = old_owner_pull_list[0]["ties"]
			win_per_pull = old_owner_pull_list[0]["win_per"]

			wins_upload = wins + wins_pull
			losses_upload = losses + losses_pull
			ties_upload = ties + ties_pull

			win_per_upload = (wins_upload + (ties_upload / 2)) / (wins_upload + losses_upload + ties_upload)
			win_per_upload = round(win_per_upload, 3)


			db[collection_owner_matchups].update({"opposing_owner": opposing_owner}, {"$set": {"wins": wins_upload, "losses": losses_upload, "ties": ties_upload, "win_per": win_per_upload}})
			
	print completed_opposing_owners_list

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
owner_number = str(sys.argv[1])
year = str(sys.argv[2])

matchupRecords(db, year, owner_number)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()