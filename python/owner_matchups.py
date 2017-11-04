##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def matchupRecords(db, owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season):

	# set tifecta matchups collection and clear it to initialze
	collection_owner_matchups = "owner" + owner_number + "_trifecta_matchups_" + year1 + "_" + year2
	db[collection_owner_matchups].remove({})

	#  set football collection
	collection_football = "owner" + owner_number + "_football_matchups_" + year1
	collection_basketball = "owner" + owner_number + "_basketball_matchups_" + year2
	collection_baseball = "owner" + owner_number + "_baseball_matchups_" + year2

	# get list of all opposing owners
	football_opposing_owners_list = list(db[collection_football].find({}, {"opposing_owner": 1, "_id": 0}))
	print football_opposing_owners_list
	opposing_owners_list = football_opposing_owners_list

	basketball_opposing_owners_list = list(db[collection_basketball].find({}, {"opposing_owner": 1, "_id": 0}))
	print basketball_opposing_owners_list

	for basketball_owners in basketball_opposing_owners_list:
		if basketball_owners not in opposing_owners_list:
			opposing_owners_list.append(basketball_owners)

	print opposing_owners_list

	# iterate through each opposing owner
	for each_opposing_owner in opposing_owners_list:

		# set opposing owner
		opposing_owner = each_opposing_owner["opposing_owner"]
		print opposing_owner

		# create ordered dictionary for input
		insert_json = OrderedDict()

		# if baseball (and therefore all sports are true)
		if baseball_in_season == "true":

			# pull individual football matchup win_per
			football_pull = list(db[collection_football].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print football_pull
			football_win_per = football_pull[0]["win_per"]
			print "football:", football_win_per

			# pull individual baasketball matchup win_per
			basketball_pull = list(db[collection_basketball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print basketball_pull
			basketball_win_per = basketball_pull[0]["win_per"]
			print "basketball: ", basketball_win_per

			# pull individual baseball matchup win_per
			baseball_pull = list(db[collection_baseball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print baseball_pull
			try:
				baseball_win_per = baseball_pull[0]["win_per"]
			except IndexError:
				baseball_win_per = "N/A"
			print "baseball: ", baseball_win_per			

			# calculate averaged total win_per
			if baseball_win_per == "N/A":
				total_win_per = (football_win_per + basketball_win_per) / 2
				total_win_per = round(total_win_per, 3)
			else:
				total_win_per = (football_win_per + basketball_win_per + baseball_win_per) / 3
				total_win_per = round(total_win_per, 3)
			print "total: ", total_win_per

			# insert into ordered dictionary for input
			insert_json["opposing_owner"] = opposing_owner
			insert_json["football_win_per"] = football_win_per
			insert_json["basketball_win_per"] = basketball_win_per
			insert_json["baseball_win_per"] = baseball_win_per
			insert_json["total_win_per"] = total_win_per

			# add into matchup collection
			db[collection_owner_matchups].insert(insert_json)

		# if basketball is (therefore also football) in season
		elif basketball_in_season == "true":

			# pull individual football matchup win_per
			football_pull = list(db[collection_football].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print football_pull
			try:
				football_win_per = football_pull[0]["win_per"]
			except IndexError:
				football_win_per = "N/A"
			print "football:", football_win_per

			# pull individual basketball matchup win_per
			basketball_pull = list(db[collection_basketball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print basketball_pull
			try:
				basketball_win_per = basketball_pull[0]["win_per"]
			except IndexError:
				basketball_win_per = "N/A"
			print "basketball: ", basketball_win_per

			# calculate averaged total win_per
			if football_win_per == "N/A":
				total_win_per = basketball_win_per
				total_win_per = round(total_win_per, 3)
			elif basketball_win_per == "N/A":
				total_win_per = football_win_per
				total_win_per = round(total_win_per, 3)
			else:				
				total_win_per = (football_win_per + basketball_win_per) / 2
				total_win_per = round(total_win_per, 3)
			print "total: ", total_win_per

			# insert into ordered dictionary for insert
			insert_json["opposing_owner"] = opposing_owner
			insert_json["football_win_per"] = football_win_per
			insert_json["basketball_win_per"] = basketball_win_per
			insert_json["total_win_per"] = total_win_per

			# add into matchup collection
			db[collection_owner_matchups].insert(insert_json)

		# else if just football
		else:

			# pull individual football matchup win_per
			football_pull = list(db[collection_football].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
			#print football_pull
			try: 
				football_win_per = football_pull[0]["win_per"]
			except IndexError:
				football_win_per = "N/A"
			print "football:", football_win_per

			# calculate averaged total win_per
			if football_win_per == "N/A":
				total_win_per = "N/A"
			else:
				total_win_per = football_win_per
				total_win_per = round(total_win_per, 3)
			print "total: ", total_win_per

			# insert into ordered dictionary for insert
			insert_json["opposing_owner"] = opposing_owner
			insert_json["football_win_per"] = football_win_per
			insert_json["total_win_per"] = total_win_per

			# add into matchup collection
			db[collection_owner_matchups].insert(insert_json)


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
year1 = str(sys.argv[2])
year2 = str(sys.argv[3])
football_in_season = str(sys.argv[4])
basketball_in_season = str(sys.argv[5])
baseball_in_season = str(sys.argv[6])

matchupRecords(db, owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season)
