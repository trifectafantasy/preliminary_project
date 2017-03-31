##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function where you make a trade!
def trade_picks(db, sport, year): 

	# pull owner names from future draft board
	owner_pull = list(db[sport + "_draft_board_" + year].find({"draft_board": "team"}, {"owner_name": 1, "_id": 0}))
	#print owner_pull

	# display owners with number selection
	owner_list = []
	counter = 1
	for owner_lister in owner_pull:
		owner_list.append(owner_lister)
		owner_name = owner_lister["owner_name"]
		print counter, ":", owner_name
		counter += 1

	# handle selection of giving owner
	while True:
		selection_index = raw_input("Select the owner that is trading AWAY the draft pick: ")
		try:
			selection_index = int(selection_index)
		except ValueError:
			continue
		if 0 < selection_index <= len(owner_list):
			selection_index = int(selection_index)
			print ""
			break
		else:
			print "Please select a valid number"
			print ""
	giving_owner = owner_list[selection_index - 1]["owner_name"]
	print "Giving Owner:", giving_owner

	# pull available picks giving owner can give
	available_picks_pull = list(db[sport + "_draft_board_" + year].find({"draft_board": "team", "owner_name": giving_owner}, {"picks": 1, "_id": 0}))
	available_picks = available_picks_pull[0]["picks"]
	print "Picks available to trade"
	for picks_display in available_picks:
		round_for_pick = int(picks_display // (len(owner_list) + .001)) + 1
		print "Round", round_for_pick, ":", picks_display
	print ""

	# handle selection of pick to trade
	while True:
		pick_to_trade = raw_input("Select the pick number to be traded: ")
		try:
			pick_to_trade = int(pick_to_trade)
		except ValueError:
			continue
		if pick_to_trade in available_picks:
			pick_to_trade = int(pick_to_trade)
			break
		else:
			print "Please select a valid pick number"
			print ""
	round_of_pick_to_trade = int(pick_to_trade // (len(owner_list) + .001)) + 1
	print "Trading Round", round_of_pick_to_trade, "Pick", pick_to_trade
	print ""

	# display owners with selection number
	counter = 1
	for owner_lister in owner_pull:
		owner_list.append(owner_lister)
		owner_name = owner_lister["owner_name"]
		print counter, ":", owner_name
		counter += 1

	# handle selection of receiving owner
	while True:
		selection_index = raw_input("Select the owner that is trading FOR the draft pick: ")
		try:
			selection_index = int(selection_index)
		except ValueError:
			continue
		if 0 < selection_index <= len(owner_list):
			selection_index = int(selection_index)
			break
		else:
			print "Please select a valid number"
			print ""
	receiving_owner = owner_list[selection_index - 1]["owner_name"]
	print "Receiving Owner:", receiving_owner

	# update overall draft board
	pull_overall = list(db[sport + "_draft_board_" + year].find({"draft_board": "overall", "round_number": round_of_pick_to_trade}))
	round_pull = pull_overall[0]["picks"]

	for round_index in range(len(round_pull)):
		if round_pull[round_index].find(str(pick_to_trade) + ":") != -1:
			round_pull[round_index] = "Pick " + str(pick_to_trade) + ": " + receiving_owner

	db[sport + "_draft_board_" + year].update({"draft_board": "overall", "round_number": round_of_pick_to_trade}, {"$set": {"picks": round_pull}})

	# update (remove) giving team's pick tp trade
	pull_giving_team = list(db[sport + "_draft_board_" + year].find({"draft_board": "team", "owner_name": giving_owner}, {"picks": 1, "_id": 0}))
	giving_team_picks = pull_giving_team[0]["picks"]
	#print giving_team_picks
	giving_team_picks.remove(pick_to_trade)
	#print giving_team_picks
	db[sport + "_draft_board_" + year].update({"draft_board": "team", "owner_name": giving_owner}, {"$set": {"picks": giving_team_picks}})

	# update (add) receiving team's pick tp trade
	pull_receiving_team = list(db[sport + "_draft_board_" + year].find({"draft_board": "team", "owner_name": receiving_owner}, {"picks": 1, "_id": 0}))
	receiving_team_picks = pull_receiving_team[0]["picks"]
	#print receiving_team_picks
	receiving_team_picks.append(pick_to_trade)
	receiving_team_picks.sort()
	#print receiving_team_picks
	db[sport + "_draft_board_" + year].update({"draft_board": "team", "owner_name": receiving_owner}, {"$set": {"picks": receiving_team_picks}})



##### PYTHON SCRIPT TO EXECUTE #####

# connect to MongoDB
try:
	client = MongoClient('mongodb://localhost:27017')
	print "Successful connection"

except pymongo.errors.ConnectionFailure, e:
	print "Count not connect to MongoDB: %s" % e

# use collection 'espn'
db = client.espn

sport = str(sys.argv[1])
year = str(sys.argv[2])


print "Let's make a trade!"

trade_picks(db, sport, year)

print "Trade complete!"
