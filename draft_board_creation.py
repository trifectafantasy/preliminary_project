##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### PYTHON SCRIPT TO EXECUTE #####

# connect to MongoDB
try:
	client = MongoClient('mongodb://localhost:27017')
	print "Successful connection"

except pymongo.errors.ConnectionFailure, e:
	print "Count not connect to MongoDB: %s" % e

# use collection 'espn'
db = client.espn

print "Create default draft board"
sport = raw_input("Sport: ")
year = raw_input("Year: ")

if sport == "football":
	number_of_rounds = 16
elif sport == "basketball":
	number_of_rounds = 14
elif sport == "baseball":
	number_of_rounds = 25
else:
	print "Not a valid sport"
	sys.exit()

teams = int(raw_input("How many teams? "))

db[sport + "_draft_board_" + year].remove({})

all_picks = range(1, teams * number_of_rounds + 1)
#print all_picks

teams_list = []
for i in range(1, teams + 1):
	team_name = raw_input("Team " + str(i) + ": ")
	#team_name = "Team" + str(i)
	teams_list.append(team_name)
#print "teams_list", teams_list

for round_number in range(number_of_rounds):
	#print "round number:", round_number + 1
	round_input = []

	draft_round = all_picks[round_number * teams: (round_number * teams) + teams]
	if (round_number + 1) % 2 == 0:
		#print "even"
		draft_round = list(reversed(draft_round))
	#print draft_round
	
	for i in range(teams):
		string = "Pick " + str(draft_round[i]) + ": " + teams_list[i]
		round_input.append(string)
	#print round_input

	this_round = OrderedDict()
	this_round["draft_board"] = "overall"
	this_round["round_number"] = round_number + 1
	this_round["picks"] = round_input
	#print this_round

	db[sport + "_draft_board_" + year].insert(this_round)

for index in range(len(teams_list)):
	each_team = teams_list[index]
	#print each_team

	each_team_picks = []
	for round_number in range(2):
		#print "round number:", round_number + 1
		round_input = []

		draft_round = all_picks[round_number * teams: (round_number * teams) + teams]
		if (round_number + 1) % 2 == 0:
			#print "even"
			draft_round = list(reversed(draft_round))
		#print draft_round

		pick_number = draft_round[index]
		#print pick_number
		if round_number == 0:
			pick1 = pick_number
		elif round_number == 1:
			pick2 = pick_number


	while ((pick1 or pick2) <= (number_of_rounds * teams)):
		each_team_picks.append(pick1)
		each_team_picks.append(pick2)
		pick1 += 20
		pick2 += 20

	#print each_team_picks

	this_team = OrderedDict()
	this_team["draft_board"] = "team"
	this_team["owner_name"] = teams_list[index]
	this_team["picks"] = each_team_picks

	db[sport + "_draft_board_" + year].insert(this_team)
