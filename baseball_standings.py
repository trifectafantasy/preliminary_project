##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys

##### DEFINE FUNCTIONS #####

# function to sort and give trifecta points based on h2h win percentage
# takes in argument of which MongoDB collection to use: 'baseball_h2h_2016'
def h2h_trifecta(db, collection):

	sorted_h2h = list(db[collection].find({}, {"team": 1, "win_per": 1, "_id": 0}).sort("win_per", -1))
	###print(sorted_h2h)

	# starting value for trifecta points to give out
	trifecta_h2h_points = 10

	# initialize factors to determine trifecta points if there is a tie
	skipped_team = False
	points_hold = []

	# loop through the sorted h2h standings from best to worst
	for i in range(len(sorted_h2h)):

		# initialize how many teams tied with current team
		same_records = 0

		current_team = sorted_h2h[i]["team"]
		current_team_win_per = sorted_h2h[i]["win_per"]

		# inner loop, looping through every other team to find any ties
		for j in range(len(sorted_h2h)):

			team_win_per = sorted_h2h[j]["win_per"]
			
			# if two teams tie in win per, increase number of teams with same record
			if current_team_win_per == team_win_per:
				same_records += 1

		# there will always be at least 1 same record (team with itself). if > 1, go into tie process
		if same_records > 1:

			# if this is the first time finding the tie, initializing the distributed tied points
			if len(points_hold) == 0:

				# points to be averaged and split are [trifecta points - # of teams tied, trifecta points]
				points_hold = range((trifecta_h2h_points + 1 - same_records), trifecta_h2h_points + 1) # need the +1 at the end since range is exclusive on the end
				# range of points allocated is summed and averaged
				dist_points = float(sum(points_hold)) / same_records
			
			# now that points have been averaged (whether it was initialized this time or last), each tied team gets this same number of distributed points
			individual_trifecta_h2h_points = dist_points

		# if there are no ties, this team gets the number of trifecta points according to their sorted rank (10 -> 1)
		else:
			individual_trifecta_h2h_points = trifecta_h2h_points

		# at the end of each loop of each team, decrease number of trifecta points (10 -> 1)
		trifecta_h2h_points -= 1
		print("team: ", current_team)
		print("h2h trifecta points: ", float(individual_trifecta_h2h_points))

		# update (not upsert or creating new document) each team's document with new field "h2h_trifecta_points"
		db[collection].update({"team": current_team}, {"$set": {"h2h_trifecta_points": individual_trifecta_h2h_points}})

# function to rank and sort by each roto category, distribute roto points per category, then sum and determine roto trifecta points
# everything is updated back into 'baseball_roto_2016' collection
# takes in input of which MongoDB collection to use: 'baseball_roto_2016'
def roto_trifecta(db, collection):	

	# list of categories
	### NOTE: SO is HITTER strikeout, K is PITCHER strikeout
	categories = ["R", "HR", "RBI", "SO", "SB", "OBP", "K", "QS", "W", "SV", "ERA", "WHIP"]

	# cycle through each category
	for this_category in categories:

		# if winning this category means having the lowest, change the sort direction
		# 1 means lowest to highest
		if this_category == "SO":
			sort_direction = 1
		elif this_category == "ERA":
			sort_direction = 1
		elif this_category == "WHIP":
			sort_direction = 1
		else:
			# -1 means highest to lowest
			sort_direction = -1

		# pull down each team's stats for current roto category into list
		category_rank = list(db[collection].find({}, {"team": 1, this_category: 1, "_id": 0}).sort(this_category, sort_direction))
		###print(category_rank)

		# like with h2h trifecta points distribution, initialize category points (10 -> 1) to be distributed and parameters for ties
		category_points = 10
		skipped_team = False
		points_hold = []
		times_dist = 0

		# loop through each team in list for each category
		for i in range(len(category_rank)):

			# initialize for ties
			same_records = 0

			current_team = category_rank[i]["team"]
			current_team_category = category_rank[i][this_category]

			# loop through all teams to find ties
			for j in range(len(category_rank)):

				team_category = category_rank[j][this_category]

				# if there is a tie, increase same records by 1
				if current_team_category == team_category:
					same_records += 1

			# if there is an actual tie (more than one tie in category)
			if same_records	> 1:

				# if not tied before, determine points to summed
				if len(points_hold) == 0:
					points_hold = range((category_points + 1 - same_records), category_points + 1)
					# sum and then divide the points for distribution
					dist_points = float(sum(points_hold)) / same_records

				# now that tied points for each team are (or were already) determined, distribute to each tied team
				# count number of times distributed to know when to stop and reset
				times_dist += 1
				individual_category_points = dist_points

				# if tied points have been distributed to all tied teams, reset points hold and times distributed
				if times_dist == same_records:
					points_hold = []
					times_dist = 0

			# if no tie, give how many remaining category points left
			else:
				individual_category_points = category_points

			# subtract 1 category point each team/loop
			category_points -= 1
			new_cat_points = "category_points_" + this_category
			print "team: ", current_team
			print new_cat_points, float(individual_category_points) 

			# create key-value pair for each roto category and corresponding roto category points per category
			each_team_each_category_points = {new_cat_points: float(individual_category_points)}
			# update collection by pushing new dictionary entry into previously initialized array for all roto category points
			db[collection].update({"team": current_team}, {"$set": {new_cat_points: float(individual_category_points)}})


### now that all roto category points have been calculated, need to sum them

	# pull down list of each team 
	team_list = list(db[collection].find({}, {"team": 1, "_id": 0}))

	# loop through each team
	for each_team_dict in team_list:
		current_team = each_team_dict["team"]

		# initializing long json that lists all the fields we want pulled down for summing the categories
		category_pull = {
			"category_points_R" : 1,
			"category_points_HR" : 1,
			"category_points_RBI" : 1,
			"category_points_SO" : 1,
			"category_points_SB" : 1,
			"category_points_OBP" : 1,
			"category_points_K" : 1,
			"category_points_QS" : 1,
			"category_points_W" : 1,
			"category_points_SV" : 1,
			"category_points_ERA" : 1,
			"category_points_WHIP" : 1,
			"_id" : 0
			}

		# pull down each team's roto category points entry (a list of key-value pairs for each category)
		total_team_roto_points = list(db[collection].find({"team": current_team}, category_pull))
		print total_team_roto_points

		# initialize total number of category roto points for said team
		individual_total_roto_points = 0

		# iterate for each category, but first need to get inside array of length 0
		for key, value in total_team_roto_points[0].iteritems():
			# add this roto category point total to total for individual team
			individual_total_roto_points += float(value)

		team_points_print = current_team.encode('ascii') + " total team roto points: "

		print team_points_print + str(individual_total_roto_points)

		# update collection with new field "total roto points" which has each team's individual total roto category points (10 -> 1)
		db[collection].update({"team": current_team}, {"$set": {"total_roto_points": individual_total_roto_points}})

### now that each team's total roto category points have been calculated, need to rank to determine trifecta roto points

	# pull down the total roto category points for each team
	sorted_roto_rank = list(db[collection].find({}, {"team": 1, "total_roto_points": 1, "_id": 0}).sort("total_roto_points", -1))

### follow same process as outlined before to rank teams, find ties, and distribute the proper number of roto trifecta points (10 -> 1)
	trifecta_roto_points = 10
	skipped_team = False
	points_hold = []
	times_dist = 0

	for i in range(len(sorted_roto_rank)):

		same_records = 0

		current_team = sorted_roto_rank[i]["team"]
		current_team_roto_points = sorted_roto_rank[i]["total_roto_points"]

		for j in range(len(sorted_roto_rank)):

			team_roto_points = sorted_roto_rank[j]["total_roto_points"]
		
			if current_team_roto_points == team_roto_points:
				same_records += 1

		if same_records > 1:

			if len(points_hold) == 0:
				points_hold = range((trifecta_roto_points + 1 - same_records), trifecta_roto_points + 1)
				dist_points = float(sum(points_hold)) / same_records

			times_dist += 1
			individual_trifecta_roto_points = dist_points

			if times_dist == same_records:
				points_hold = []
				times_dist = 0

		else:
			individual_trifecta_roto_points = trifecta_roto_points

		trifecta_roto_points -= 1
		print "team: ", current_team
		print "trifecta points: ", float(individual_trifecta_roto_points)
		print ""

		# update roto collection with new field "roto trifecta points (10 -> 1)"
		db[collection].update({"team": current_team}, {"$set": {"roto_trifecta_points": individual_trifecta_roto_points}})


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
collection1 = "baseball_h2h_" + year
collection2 = "baseball_roto_" + year

h2h_trifecta(db, collection1)
roto_trifecta(db, collection2)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()