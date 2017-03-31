##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict
import math

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def originCalculation(db, sport, year, owner_number):

	# define collection names
	collection_acquisition = "owner" + owner_number + "_" + sport + "_acquisitions_" + year
	collection_origin = sport + "_origin_" + year
	collection_owner = "owner" + owner_number

	# pull owner name
	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	#print owner_name

	# remove blank players
	db[collection_acquisition].remove({"player": ""})

	# clear origin collection for this owner
	db[collection_origin].remove({"owner": owner_name})

	# initialize counting variables
	draft_pr = 0.0
	fa_pr = 0.0
	trade_pr = 0.0
	total_pr = 0.0	

	# pull all players from acquisistion collection
	acquisition_list = list(db[collection_acquisition].find({}, {"_id": 0}))
	#print acquisition_list

	# loop through each player's stats
	for each_player in acquisition_list:
		print each_player

		# if len(each_player) == 4, then player just drafted, so can skip, never played, no contribution
		if len(each_player) == 4:
			continue
		
		insert_json = OrderedDict()

		# try and pull PR
		try:
			PR = each_player["PR"]
		# if error
		except KeyError:
			print "no PR"
			continue		

		# try to pull IP, if can't hitter
		try:
			IP = each_player["IP"]
		# if can't, hitter
		except KeyError:
			print "hitter"

			player = each_player["player"]
			acquired = each_player["acquired"]
			PR = each_player["PR"]
			GP = each_player["GP"]
			# if GP is Nan same as 0
			if math.isnan(GP):
				GP = 0

			# calculate weighted PR
			weigheted_PR = PR * GP
			print player, acquired, PR, GP, weigheted_PR	

			# sum to totals according to where drafted
			if acquired == "Draft":
				draft_pr += weigheted_PR
			elif acquired == "Trade":
				trade_pr += weigheted_PR
			elif acquired == "FA":
				fa_pr += weigheted_PR

			total_pr += weigheted_PR

			continue

		# try to pull GP, if can't pitcher
		try:
			GP = each_player["GP"]
		# if can't, pitcher
		except KeyError:
			print "pitcher"

			player = each_player["player"]
			acquired = each_player["acquired"]
			PR = each_player["PR"]
			IP = each_player["IP"]
			# check if IP is Nan
			if math.isnan(IP):
				IP = 0

			# convert IP to usable 1/3 and 2/3 of innings
			if ".1" in str(IP):
				IP_calc = round(IP,0) + 0.33
			elif ".2" in str(IP):
				IP_calc = round(IP,0) + 0.67
			else:
				IP_calc = IP

			# calculate weighted PR
			weigheted_PR = PR * IP_calc / 2
			print player, acquired, PR, IP, weigheted_PR	

			# sum to totals depending on acquisition method
			if acquired == "Draft":
				draft_pr += weigheted_PR
			elif acquired == "Trade":
				trade_pr += weigheted_PR
			elif acquired == "FA":
				fa_pr += weigheted_PR

			total_pr += weigheted_PR

			continue	

	# calculate percentages	
	draft_pct = draft_pr / total_pr * 100
	fa_pct = fa_pr / total_pr * 100
	trade_pct = trade_pr / total_pr * 100

	insert_json["owner"] = owner_name
	insert_json["total_pr"] = round(total_pr, 1)
	insert_json["draft_pct"] = round(draft_pct, 1)
	insert_json["fa_pct"] = round(fa_pct, 1)
	insert_json["trade_pct"] = round(trade_pct, 1)
	insert_json["draft_pr"] = round(draft_pr, 1)
	insert_json["fa_pr"] = round(fa_pr, 1)
	insert_json["trade_pr"] = round(trade_pr, 1)
	
	print insert_json
	db[collection_origin].insert(insert_json)

	
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

originCalculation(db, sport, year, owner_number)
