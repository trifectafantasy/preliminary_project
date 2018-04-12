##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def historicalRecords(db, owner_number):

	historical_records_collection = "owner" + owner_number + "_historical_records"
	db[historical_records_collection].remove()

	football_wins = 0
	football_losses = 0
	football_ties = 0

	basketball_wins = 0
	basketball_losses = 0
	basketball_ties = 0

	baseball_wins = 0
	baseball_losses = 0
	baseball_ties = 0

	collection_owner_football = "owner" + owner_number + "_football_matchups_all"
	collection_owner_basketball = "owner" + owner_number + "_basketball_matchups_all"
	collection_owner_baseball = "owner" + owner_number + "_baseball_matchups_all"

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

	football_json = OrderedDict()

	football_json["sport"] = "Football"
	football_json["wins"] = football_wins
	football_json["losses"] = football_losses
	football_json["ties"] = football_ties
	football_json["win_per"] = football_win_per

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

	basketball_json = OrderedDict()

	basketball_json["sport"] = "Basketball"
	basketball_json["wins"] = basketball_wins
	basketball_json["losses"] = basketball_losses
	basketball_json["ties"] = basketball_ties
	basketball_json["win_per"] = basketball_win_per

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

	baseball_json = OrderedDict()

	baseball_json["sport"] = "Baseball"
	baseball_json["wins"] = baseball_wins
	baseball_json["losses"] = baseball_losses
	baseball_json["ties"] = baseball_ties
	baseball_json["win_per"] = baseball_win_per

	insert = [football_json, basketball_json, baseball_json]
	print insert

	db[historical_records_collection].insert(insert)




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

historicalRecords(db, owner_number)
