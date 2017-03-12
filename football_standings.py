##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys

##### DEFINE FUNCTIONS #####

# function to sort and give trifecta points based on h2h win percentage
# takes in argument of which MongoDB collection to use: 'football_2015_h2h'
def combine_databases(db, collection_h2h, collection_roto):

	# pull team list
	pull_teams = list(db[collection_h2h].find({}, {"team": 1, "_id": 0}))
	
	# loop through each team to get team name
	for i in range(len(pull_teams)):
		team_name = pull_teams[i]["team"]

		other_categories = ["PF", "PA"]

		# loop through PF and PA to get roto points
		for category in other_categories:

			# pull PF and PA to add to h2h collection
			pull_other = list(db[collection_roto].find({"team": team_name}, {category: 1, "_id": 0}))
			#print pull_other
			input_value = pull_other[0][category]
			db[collection_h2h].update({"team": team_name}, {"$set": {category: float(input_value)}})


# function that calculates and distributes trifecta points based off of win percentage with PF as a tiebreaker
def trifecta_points(db, collection): 

	# pull new combiend h2h collection sorted by win percentage
	sorted_record = list(db[collection].find({}, {"team": 1, "win_per": 1, "PF": 1, "_id": 0}).sort("win_per", -1))
	#print sorted_record

	# initialize starting trifecta points
	trifecta_points = 10
	deserves_more = False

	# loop through each team's win per and PF
	for i in range(len(sorted_record)):

		# set team name, win per, PF
		current_team = sorted_record[i]["team"]
		current_team_win_per = sorted_record[i]["win_per"]
		current_team_PF = sorted_record[i]["PF"]

		# reset individual trifecta points
		individual_trifecta_points = 0

		# if last one, either straight or add point if result of tie
		if i + 1 == len(sorted_record):
			if deserves_more == False:
				individual_trifecta_points = trifecta_points
			else:
				individual_trifecta_points = trifecta_points + 1
		# if not last
		else:
			# if deserves more, when in tie in win percentage, add point back
			if deserves_more == True:
				individual_trifecta_points = trifecta_points + 1
				deserves_more = False

			# loop through all teams behind in win percentage
			for j in range(i + 1, len(sorted_record)):

				# take down other team's name, win per and PF
				other_team = sorted_record[j]["team"]
				other_team_win_per = sorted_record[j]["win_per"]
				other_team_PF = sorted_record[j]["PF"]

				# if tie go into tiebreaker
				if current_team_win_per == other_team_win_per:
					print "Tie in win %!"

					# find team that has more PF as tiebreaker
					if current_team_PF > other_team_PF:
						# distribute points and does not deserve more
						individual_trifecta_points = trifecta_points
						deserves_more = False

					elif current_team_PF == other_team_PF:
						print "TIE IN BOTH WIN % AND PF!!!!!"

					# if next team has more PF
					else:
						# distribute one less point and next player gets one more point
						individual_trifecta_points = trifecta_points - 1
						deserves_more = True
				else:
					if individual_trifecta_points == 0:
							individual_trifecta_points = trifecta_points

		# at the end of each loop, subtract one available trifecta point
		trifecta_points -= 1

		print "Team:", current_team
		print "Trifecta points", individual_trifecta_points

		db[collection].update({"team": current_team}, {"$set": {"trifecta_points": individual_trifecta_points}})


##### PYTHON SCRIPT TO EXECUTE #####

# in a subprocess, open mongodb connection
mongod = subprocess.Popen(["mongod"])
time.sleep(.5)

# connect to MongoDB
try:
	client = MongoClient('mongodb://localhost:27017')
	print "Successful connection"

except pymongo.errors.ConnectionFailure, e:
	print "Count not connect to MongoDB: %s" % e

# use collection 'espn'
db = client.espn

# define collections to be used
year = str(sys.argv[1])
collection_h2h = "football_h2h_" + year
collection_roto = "football_roto_" + year

combine_databases(db, collection_h2h, collection_roto)
trifecta_points(db, collection_h2h)

# sleep and terminate mongodb instance
time.sleep(.5)
mongod.terminate()