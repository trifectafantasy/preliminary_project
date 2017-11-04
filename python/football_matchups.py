##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# given scrape matchup data, process to get all head to head matchup data
def matchupRecords(db, year, owner_number):

	# set collection name and clear it for future inserts
	collection_owner_matchups = "owner" + owner_number + "_football_matchups_" + year
	db[collection_owner_matchups].remove({})
   
	#  set collection name of scrape collection and pull 
	collection_owner_matchups_scrape = "owner" + owner_number + "_football_matchups_scrape_" + year
	matchups_total_list = list(db[collection_owner_matchups_scrape].find({}, {"_id": 0}))
	#print matchups_total_list

	# initialize completed owners list
	completed_opposing_owners_list = []

	# loop through each matchup in scrape collection
	for matchup in matchups_total_list:

		# reset each parameter to 0 at each iteration	
		wins = 0.0
		losses = 0.0
		ties = 0.0

		# create ordered dictionary for upload
		insert_json = OrderedDict()

		# set pulled variables
		opposing_owner = matchup["opposing_owner"]
		PF = float(matchup["PF"])
		PA = float(matchup["PA"])
		print "opposing owner: ", opposing_owner
		print "PF: ", PF
		print "PA: ", PA

		# depending on points for and against, win, loss, or tie
		if PF > PA:
			wins = 1
		elif PF < PA:
			losses = 1
		else:
			ties = 1

		# if current opposing owner has not been inserted and processedyet
		if opposing_owner not in completed_opposing_owners_list:
			print "new opposing owner"

			# calculate win_per and pt_diff
			win_per = (wins + (ties / 2)) / (wins + losses + ties)
			pt_diff = PF - PA

			# insert into ordered dictionary for insert
			insert_json["opposing_owner"] = opposing_owner
			insert_json["wins"] = wins
			insert_json["losses"] = losses
			insert_json["ties"] = ties
			insert_json["win_per"] = round(win_per, 3)
			insert_json["PF"] = round(PF, 1)
			insert_json["PA"] = round(PA, 1)
			insert_json["pt_diff"] = round(pt_diff, 1)

			# insert into matchup collection
			db[collection_owner_matchups].insert(insert_json)

			# add completed owner to list of completed owners
			completed_opposing_owners_list.append(opposing_owner)

		# if and already processed and uploaded owner, pull, recalculate, and update
		else:
			print "old owner"

			# pull matchup collection and all its values
			old_owner_pull_list = list(db[collection_owner_matchups].find({"opposing_owner": opposing_owner}, {"wins": 1, "losses": 1, "ties": 1, "win_per": 1, "PF": 1, "PA": 1, "pt_diff": 1, "_id": 0}))
			wins_pull = old_owner_pull_list[0]["wins"]
			losses_pull = old_owner_pull_list[0]["losses"]
			ties_pull = old_owner_pull_list[0]["ties"]
			win_per_pull = old_owner_pull_list[0]["win_per"]
			PF_pull = old_owner_pull_list[0]["PF"]
			PA_pull = old_owner_pull_list[0]["PA"]
			pt_diff_pull = old_owner_pull_list[0]["pt_diff"]

			# recalculate parameters
			wins_upload = wins + wins_pull
			losses_upload = losses + losses_pull
			ties_upload = ties + ties_pull
			win_per_upload = (wins_upload + (ties_upload / 2)) / (wins_upload + losses_upload + ties_upload)
			win_per_upload = round(win_per_upload, 3)
			PF_upload = round(PF + PF_pull, 1)
			PA_upload = round(PA + PA_pull, 1)
			pt_diff_upload = round(PF_upload - PA_upload, 1)

			# update matchup collection with new values
			db[collection_owner_matchups].update({"opposing_owner": opposing_owner}, {"$set": {"wins": wins_upload, "losses": losses_upload, "ties": ties_upload, "win_per": win_per_upload, "PF": PF_upload, "PA": PA_upload, "pt_diff": pt_diff_upload}})
			

		print "wins: ", wins
		print "losses: ", losses
		print "ties: ", ties
		print ""

	print completed_opposing_owners_list
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
owner_number = str(sys.argv[1])
year = str(sys.argv[2])

matchupRecords(db, year, owner_number)
