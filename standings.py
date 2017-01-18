from pymongo import MongoClient
import subprocess
import time
import numpy as np

def h2h_trifecta(collection):

	sorted_h2h = list(collection.find({}, {"team": 1, "win_per": 1, "_id": 0}).sort("win_per", -1))

	#sorted_h2h = np.array(sorted_h2h)
	#print(sorted_h2h)

	trifecta_h2h_points = 10
	skipped_team = False
	points_hold = []

	for i in range(len(sorted_h2h)):

		same_records = 0

		current_team = sorted_h2h[i]["team"]
		current_team_win_per = sorted_h2h[i]["win_per"]

		for j in range(len(sorted_h2h)):

			team_win_per = sorted_h2h[j]["win_per"]
		
			if current_team_win_per == team_win_per:
				same_records += 1

		if same_records > 1:

			if len(points_hold) == 0:
				points_hold = range((trifecta_h2h_points + 1 - same_records), trifecta_h2h_points + 1)
				dist_points = float(sum(points_hold)) / same_records
			
			individual_trifecta_h2h_points = dist_points

		else:
			individual_trifecta_h2h_points = trifecta_h2h_points

		trifecta_h2h_points -= 1
		print("team: ", current_team)
		print("trifecta points: ", float(individual_trifecta_h2h_points))

		collection.update({"team": current_team}, {"$set": {"h2h_trifecta_points": individual_trifecta_h2h_points}})

def roto_trifecta(collection):	

	categories = ["R", "HR", "RBI", "SO", "SB", "OBP", "K", "QS", "W", "SV", "ERA", "WHIP"]

	collection.update({}, {"$set": {"roto_category_points": []}}, multi = True)
	
	for this_category in categories:

		if this_category == "SO":
			sort_direction = 1
		elif this_category == "ERA":
			sort_direction = 1
		elif this_category == "WHIP":
			sort_direction = 1
		else:
			sort_direction = -1

		category_rank = list(collection.find({}, {"team": 1, this_category: 1, "_id": 0}).sort(this_category, sort_direction))
		category_rank_array = np.array(category_rank)
		#print(category_rank)

		category_points = 10
		skipped_team = False
		points_hold = []
		each_team_category_points = []


		for i in range(len(category_rank_array)):

			same_records = 0

			current_team = category_rank_array[i]["team"]
			current_team_category = category_rank_array[i][this_category]

			for j in range(len(category_rank_array)):

				team_category = category_rank_array[j][this_category]

				if current_team_category == team_category:
					same_records += 1

			if same_records	> 1:

				if len(points_hold) == 0:
					points_hold = range((category_points + 1 - same_records), category_points + 1)
					dist_points = float(sum(points_hold)) / same_records

				individual_category_points = dist_points

			else:
				individual_category_points = category_points

			category_points -= 1

			new_cat_points = "category_points_" + this_category
			print("team: ", current_team)
			print(new_cat_points, float(individual_category_points))

			each_team_each_category_points = {new_cat_points: float(individual_category_points)}
			collection.update({"team": current_team}, {"$push": {"roto_category_points": each_team_each_category_points}})

	team_list = list(collection.find({}, {"team": 1, "_id": 0}))

	for each_team_dict in team_list:
		current_team = each_team_dict["team"]
		#print(each_team)

		total_team_roto_points = list(collection.find({"team": current_team}, {"roto_category_points": 1, "_id": 0}))
		#print(total_team_roto_points)

		individual_total_roto_points = 0

		for each_category in total_team_roto_points[0]["roto_category_points"]:
			for key, value in each_category.iteritems():
				individual_total_roto_points += float(value)

		team_points_print = current_team.encode('ascii') + " total team roto points: "

		print team_points_print + str(individual_total_roto_points)

		collection.update({"team": current_team}, {"$set": {"total_roto_points": individual_total_roto_points}})


	sorted_roto_rank = list(collection.find({}, {"team": 1, "total_roto_points": 1, "_id": 0}).sort("total_roto_points", -1))

	trifecta_roto_points = 10
	skipped_team = False
	points_hold = []

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
			
			individual_trifecta_roto_points = dist_points

		else:
			individual_trifecta_roto_points = trifecta_roto_points

		trifecta_roto_points -= 1
		print("team: ", current_team)
		print("trifecta points: ", float(individual_trifecta_roto_points))

		collection.update({"team": current_team}, {"$set": {"roto_trifecta_points": individual_trifecta_roto_points}})


mongod = subprocess.Popen(["mongod"])
time.sleep(2)

try:
	client = MongoClient('mongodb://localhost:27017')
	print "Successful connection"

except pymongo.errors.ConnectionFailure, e:
	print "Count not connect to MongoDB: %s" % e

db = client.espn
collection1 = db.baseball_2016_h2h
collection2 = db.baseball_2016_roto

h2h_trifecta(collection1)
roto_trifecta(collection2)

time.sleep(3)
mongod.terminate()
