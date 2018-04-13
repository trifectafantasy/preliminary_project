##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def historicalRecords(db, owner_number, sport):

	# pull owner name per owner number
	collection_owner = "owner" + owner_number
	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	print "owner: ", owner_name	

	historical_records_collection = "owner_historical_records"
	db[historical_records_collection].remove({"owner_name": owner_name, "sport": sport})

	if sport == "football":

		### FOOTBALL ###
		football_wins = 0
		football_losses = 0
		football_ties = 0
		collection_owner_football = "owner" + owner_number + "_football_matchups_all"
		
		football_matchups = list(db[collection_owner_football].find())
		#print football_matchups

		for each_football in football_matchups:

			football_wins += each_football["wins"]
			football_losses	+= each_football["losses"]
			football_ties += each_football["ties"]

		football_win_per = round((football_wins + (football_ties / 2)) / (football_wins + football_losses + football_ties), 3)

		print "Football wins:", football_wins
		print "Football losses:", football_losses
		print "Football ties:", football_ties
		print "Football win %:", football_win_per

		combined_json = OrderedDict()
		combined_json["owner_name"] = owner_name
		combined_json["football_wins"] = football_wins
		combined_json["football_losses"] = football_losses
		combined_json["football_ties"] = football_ties
		combined_json["football_win_per"] = football_win_per
		combined_json["sport"] = "football"
		db[historical_records_collection].insert(combined_json)

	elif sport == "basketball":

		### BASKETBALL ###
		basketball_wins = 0
		basketball_losses = 0
		basketball_ties = 0	
		collection_owner_basketball = "owner" + owner_number + "_basketball_matchups_all"

		basketball_matchups = list(db[collection_owner_basketball].find())
		#print basketball_matchups

		for each_basketball in basketball_matchups:

			basketball_wins += each_basketball["wins"]
			basketball_losses += each_basketball["losses"]
			basketball_ties += each_basketball["ties"]

		basketball_win_per = round((basketball_wins + (basketball_ties / 2)) / (basketball_wins + basketball_losses + basketball_ties), 3)

		print "Basketball wins;", basketball_wins
		print "Basketball losses:", basketball_losses
		print "Basketball ties:", basketball_ties
		print "Basketball win %:", basketball_win_per

		combined_json = OrderedDict()
		combined_json["owner_name"] = owner_name
		combined_json["basketball_wins"] = basketball_wins
		combined_json["basketball_losses"] = basketball_losses
		combined_json["basketball_ties"] = basketball_ties
		combined_json["basketball_win_per"] = basketball_win_per
		combined_json["sport"] = "basketball"
		db[historical_records_collection].insert(combined_json)

	elif sport == "baseball":

		### BASEBALL ###
		baseball_wins = 0
		baseball_losses = 0
		baseball_ties = 0	
		collection_owner_baseball = "owner" + owner_number + "_baseball_matchups_all"

		baseball_matchups = list(db[collection_owner_baseball].find())
		#print basketball_matchups

		for each_baseball in baseball_matchups:

			baseball_wins += each_baseball["wins"]
			baseball_losses += each_baseball["losses"]
			baseball_ties += each_baseball["ties"]

		baseball_win_per = round((baseball_wins + (baseball_ties / 2)) / (baseball_wins + baseball_losses + baseball_ties), 3)

		print "Baseball wins:", baseball_wins
		print "Baseball losses:", baseball_losses
		print "Baseball ties:", baseball_ties
		print "Baseball win %:", baseball_win_per

		combined_json = OrderedDict()
		combined_json["owner_name"] = owner_name
		combined_json["baseball_wins"] = baseball_wins
		combined_json["baseball_losses"] = baseball_losses
		combined_json["baseball_ties"] = baseball_ties
		combined_json["baseball_win_per"] = baseball_win_per
		combined_json["sport"] = "baseball"
		db[historical_records_collection].insert(combined_json)



def combinedHistoricalRecords(db, owner_number):

	# pull owner name per owner number
	collection_owner = "owner" + owner_number
	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	print "owner: ", owner_name	

	historical_records_collection = "owner_historical_records"
	db[historical_records_collection].remove({"owner_name": owner_name, "sport": "combined"})


	### FOOTBALL ###
	football_wins = 0
	football_losses = 0
	football_ties = 0
	collection_owner_football = "owner" + owner_number + "_football_matchups_all"
	
	football_matchups = list(db[collection_owner_football].find())
	#print football_matchups

	for each_football in football_matchups:

		football_wins += each_football["wins"]
		football_losses	+= each_football["losses"]
		football_ties += each_football["ties"]

	football_win_per = round((football_wins + (football_ties / 2)) / (football_wins + football_losses + football_ties), 3)
	print "Football win %:", football_win_per


	### BASKETBALL ###
	basketball_wins = 0
	basketball_losses = 0
	basketball_ties = 0	
	collection_owner_basketball = "owner" + owner_number + "_basketball_matchups_all"

	basketball_matchups = list(db[collection_owner_basketball].find())
	#print basketball_matchups

	for each_basketball in basketball_matchups:

		basketball_wins += each_basketball["wins"]
		basketball_losses += each_basketball["losses"]
		basketball_ties += each_basketball["ties"]

	basketball_win_per = round((basketball_wins + (basketball_ties / 2)) / (basketball_wins + basketball_losses + basketball_ties), 3)
	print "Basketball win %:", basketball_win_per


	### BASEBALL ###
	baseball_wins = 0
	baseball_losses = 0
	baseball_ties = 0	
	collection_owner_baseball = "owner" + owner_number + "_baseball_matchups_all"

	baseball_matchups = list(db[collection_owner_baseball].find())
	#print basketball_matchups

	for each_baseball in baseball_matchups:

		baseball_wins += each_baseball["wins"]
		baseball_losses += each_baseball["losses"]
		baseball_ties += each_baseball["ties"]

	baseball_win_per = round((baseball_wins + (baseball_ties / 2)) / (baseball_wins + baseball_losses + baseball_ties), 3)
	print "Baseball win %:", baseball_win_per

	combined_win_per = round((football_win_per + basketball_win_per + baseball_win_per) / 3, 3)
	print "Combined win %:", combined_win_per

	combined_json = OrderedDict()
	combined_json["owner_name"] = owner_name
	combined_json["football_win_per"] = football_win_per
	combined_json["basketball_win_per"] = basketball_win_per
	combined_json["baseball_win_per"] = baseball_win_per
	combined_json["combined_win_per"] = combined_win_per
	combined_json["sport"] = "combined"
	db[historical_records_collection].insert(combined_json)


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

for owner_number in range(1,11):
	owner_number = str(owner_number)

	if sport == "combined":
		combinedHistoricalRecords(db, owner_number)
	else:
		historicalRecords(db, owner_number, sport)
