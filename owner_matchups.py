##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that creates a trifecta season-long standings based on however much data is available for each sport
def matchupRecords(db, owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season):

	collection_owner_matchups = "owner" + owner_number + "_trifecta_matchups_" + year1 + "_" + year2
	db[collection_owner_matchups].remove({})

	collection_football = "owner" + owner_number + "_football_matchups_" + year1

	opposing_owners_list = list(db[collection_football].find({}, {"opposing_owner": 1, "_id": 0}))
	#print opposing_owners_list

	for each_opposing_owner in opposing_owners_list:

		opposing_owner = each_opposing_owner["opposing_owner"]
		print opposing_owner

		insert_json = OrderedDict()

		if baseball_in_season == "true":

			football_pull = list(db[collection_football].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print football_pull
			football_win_per = football_pull[0]["win_per"]
			print "football:", football_win_per

			collection_basketball = "owner" + owner_number + "_basketball_matchups_" + year2
			basketball_pull = list(db[collection_basketball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print basketball_pull
			basketball_win_per = basketball_pull[0]["win_per"]
			print "basketball: ", basketball_win_per

			collection_baseball = "owner" + owner_number + "_baseball_matchups_" + year2
			baseball_pull = list(db[collection_baseball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print baseball_pull
			baseball_win_per = baseball_pull[0]["win_per"]
			print "baseball: ", baseball_win_per			

			total_win_per = (football_win_per + basketball_win_per + baseball_win_per) / 3
			total_win_per = round(total_win_per, 3)
			print "total: ", total_win_per

			insert_json["opposing_owner"] = opposing_owner
			insert_json["football_win_per"] = football_win_per
			insert_json["basketball_win_per"] = basketball_win_per
			insert_json["baseball_win_per"] = baseball_win_per
			insert_json["total_win_per"] = total_win_per

			db[collection_owner_matchups].insert(insert_json)


		elif basketball_in_season == "true":

			football_pull = list(db[collection_football].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print football_pull
			football_win_per = football_pull[0]["win_per"]
			print "football:", football_win_per

			collection_basketball = "owner" + owner_number + "_basketball_matchups_" + year2
			basketball_pull = list(db[collection_basketball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print basketball_pull
			basketball_win_per = basketball_pull[0]["win_per"]
			print "basketball: ", basketball_win_per

			total_win_per = (football_win_per + basketball_win_per) / 2
			total_win_per = round(total_win_per, 3)
			print "total: ", total_win_per

			insert_json["opposing_owner"] = opposing_owner
			insert_json["football_win_per"] = football_win_per
			insert_json["basketball_win_per"] = basketball_win_per
			insert_json["total_win_per"] = total_win_per

			db[collection_owner_matchups].insert(insert_json)

		else:
			football_pull = list(db[collection_football].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print football_pull
			football_win_per = football_pull[0]["win_per"]
			print "football:", football_win_per

			total_win_per = football_win_per
			total_win_per = round(total_win_per, 3)
			print "total: ", total_win_per

			insert_json["opposing_owner"] = opposing_owner
			insert_json["football_win_per"] = football_win_per
			insert_json["total_win_per"] = total_win_per

			db[collection_owner_matchups].insert(insert_json)



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
year1 = str(sys.argv[2])
year2 = str(sys.argv[3])
football_in_season = str(sys.argv[4])
basketball_in_season = str(sys.argv[5])
baseball_in_season = str(sys.argv[6])

matchupRecords(db, owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()