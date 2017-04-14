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

print "Assign starting draft picks"
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

all_picks = range(1, teams * number_of_rounds + 1)
#print all_picks

teams_list = []
for i in range(1, teams + 1):
	team_name = raw_input("Team " + str(i) + ": ")
	#team_name = "Team" + str(i)
	teams_list.append(team_name)
#print "teams_list", teams_list

db[sport + "_draft_board_" + year].remove({})

for index in range(len(teams_list)):
	each_team = teams_list[index]
	#print each_team

	each_team_picks = []
	for round_number in range(1, number_of_rounds + 1):
		#print "round number:", round_number
		
		round_selection = "R" + str(round_number)
		each_team_picks.append(round_selection)

	#print each_team_picks

	this_team = OrderedDict()
	this_team["draft_board"] = "team"
	this_team["owner_name"] = teams_list[index]
	this_team["picks"] = each_team_picks

	db[sport + "_draft_board_" + year].insert(this_team)
