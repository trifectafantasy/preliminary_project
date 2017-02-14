##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def coachAnalysis(db, year, owner_number, completed_weeks):

	# set collection names
	collection_scrape = "owner" + owner_number + "_coach_scrape_" + year
	collection_coach = "all_coach_" + year
	collection_owner = "owner" + owner_number

	# pull owner name per owner number
	owner_pull = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))
	owner_name = owner_pull[0]["owner"]
	print owner_name

	# clear specific owner's document from all collection
	db[collection_coach].remove({"owner": owner_name})

	# set season points lost at 0 at the beginning
	season_points_lost = 0

	# loop through each week that is completed
	for week in range(1, int(completed_weeks) + 1):
		print "week", week

		# initialize variables needed for each week
		flex_left = []
		total_points_lost = 0

		# list of positions, FLEX last
		position_list = ["QB", "RB", "WR", "TE", "K", "D/ST", "FLEX"]

		# loop through each position
		for position in position_list:

			# pull starting players per position
			starting_pull = list(db[collection_scrape].find({"week": week, "status": "starters"}, {position: 1, "_id": 0}))
			starting_points_pull = starting_pull[0][position]
			print position, starting_points_pull			

			# if not flex, pull from all collection (no FLEX position in all)
			if position != "FLEX":
				scrape_pull = list(db[collection_scrape].find({"week": week, "status": "all"}, {position: 1, "_id": 0}))
				sorted_position = sorted(scrape_pull[0][position], reverse=True)
				print position, sorted_position

			# if position is QB, 1 can start
			if position == "QB":
				optimal_position_points = sorted_position[0]
				starting_points = starting_points_pull[0]

			# if position is RB, 2 can start, and add to potential flex players
			elif position == "RB":
				optimal_position_points = sum(sorted_position[0:2])
				starting_points = sum(starting_points_pull[0:2])
				flex_left += sorted_position[2:]

			# if position is WR, 2 can start, and add to potential flex players
			elif position == "WR":
				optimal_position_points = sum(sorted_position[0:2])
				starting_points = sum(starting_points_pull[0:2])
				flex_left += sorted_position[2:]

			# if position is TE, 1 can start, and add to potential flex players
			elif position == "TE":		
				optimal_position_points = sorted_position[0]
				starting_points = starting_points_pull[0]
				flex_left += sorted_position[1:]

			# if position is K, 1 can start
			elif position == "K":
				optimal_position_points = sorted_position[0]
				starting_points = starting_points_pull[0]

			# if position is D/ST, 1 can start
			elif position == "D/ST":
				optimal_position_points = sorted_position[0]
				starting_points = starting_points_pull[0]

			# if position is FLEX, 1 can start out of remaining FLEX eligible players
			elif position == "FLEX":
				sorted_flex = sorted(flex_left, reverse=True)
				print position, sorted_flex
				optimal_position_points = sorted_flex[0]
				starting_points = starting_points_pull[0]

			# after assigning startign and optimal points, subtract to find points lost and add to total points lost per week
			points_lost = starting_points - optimal_position_points
			print position, "points lost", points_lost
			total_points_lost += points_lost

			print ""

		# after position loop ends, round and print
		total_points_lost = round(total_points_lost, 1)
		print "week", week, "total points lost", total_points_lost

		# create week field name for insert into document
		week_field = "week" + str(week)

		# if first week, insert, if not, update
		if week == 1:
			db[collection_coach].insert({"owner": owner_name, week_field: total_points_lost})
		else:
			db[collection_coach].update({"owner": owner_name}, {"$set": {week_field: total_points_lost}})

	# after each week loop is done, pull owner's document
	total_pull = list(db[collection_coach].find({"owner": owner_name}, {"owner": 0, "_id": 0}))
	print total_pull
	total_pull_dict = total_pull[0]

	# loop through each key in document (each week, no owner)
	for each_week in total_pull_dict:
		#print each_week
		season_points_lost += total_pull_dict[each_week]

	# round and insert season points to all owners collection
	season_points_lost = round(season_points_lost, 1)
	print "season points lost", season_points_lost
	db[collection_coach].update({"owner": owner_name}, {"$set": {"season": season_points_lost}})
	

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
year = str(sys.argv[1])
owner_number = str(sys.argv[2])
completed_weeks = str(sys.argv[3])


coachAnalysis(db, year, owner_number, completed_weeks)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()