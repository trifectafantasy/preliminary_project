##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that creates a trifecta season-long standings based on however much data is available for each sport
def trifectaSeasonPoints(db, year1, year2, football_in_season, basketball_in_season, baseball_in_season):

	# name and initialize trifecta season collection
	collection_season_trifecta = "trifecta_" + year1 + "_" + year2
	db[collection_season_trifecta].remove({})

	# initialize array that will be used to upload to trifecta season collection at thend
	trifecta_upload = []

	# loop through however many owners there are
	number_of_owners = 10
	for owner_num in range(1, number_of_owners + 1):

		# create new ordered dictionary every owner iteration
		input_json = OrderedDict()

		# create each owner collection (e.g.: owner1, owner2)
		owner_collection = "owner" + str(owner_num)
		# pull each owner name from owner collection
		owner = list(db[owner_collection].find({}, {"owner": 1, "_id": 0}))[0]
		owner_name = owner["owner"]
		#print "owner: ", owner_name

##### Football #####
		# if football is in season (ie has data)
		if football_in_season == "true":

			collection_football_trifecta = "football_trifecta_" + year1
			football_count = db[collection_football_trifecta].count()
			#print football_count

			# if sport trifecta collection has 10 documents, just pull from sport trifecta collection
			if football_count == 10:

				# pull total trifecta points per team
				football_list = list(db[collection_football_trifecta].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}))

				# loop through each team pull
				for football_info in football_list:
					football_team = football_info["team"]
					football_points = football_info["total_trifecta_points"]
					#print football_team

					# set path for finding owner through team name
					path = "teams." + football_team

					owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
					#print owner_check
					owner_name_check = owner_check["teams"][football_team]["owner"]
					#print owner_name_check

					# if owner names match, set correct team name and trifecta points
					if owner_name == owner_name_check:
						correct_team_name = football_team
						correct_trifecta_points = football_points

				football_trifecta_points = correct_trifecta_points
				print "football team name: ", correct_team_name
				print "football trifecta points: ", football_trifecta_points

			# if there are not 10 documents, then take current sport trifecta points from h2h colletion in mongodb
			else:

				# set h2h football collection
				collection_football = "football_h2h_" + year1

				# pull trifecta points from h2h collection
				football_list = list(db[collection_football].find({}, {"team": 1, "trifecta_points": 1, "_id": 0}))
				
				# loop through h2h pull
				for football_info in football_list:
					football_team = football_info["team"]
					football_points = football_info["trifecta_points"]
					#print football_team

					# set path for finding owner through team name
					path = "teams." + football_team
					#print path
					while path.find(".", 6) != -1:
					#if path.find(".", 6) != -1:
						period_index = path.find(".", 6)
						#print period_index
						path = path[:period_index] + "\uff0E" + path[period_index + 1:]
						football_team = football_team[:period_index - 6] + "\uff0E" + football_team[period_index + 1 - 6:]
						#print football_team	

					owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
					#print owner_check
					owner_name_check = owner_check["teams"][football_team]["owner"]
					#print owner_name_check

					# if owner names are same, set correct team name and trifecta points
					if owner_name == owner_name_check:
						correct_team_name = football_team
						correct_trifecta_points = football_points

				# set final correct trifeta points as football trifecta points
				football_trifecta_points = correct_trifecta_points
				print "football team name: ", correct_team_name
				print "football trifecta points: ", football_trifecta_points

		# if football is not in season, just assign 0 trifecta points
		else: 
			football_trifecta_points = 0

##### Baksetball #####
		
		# same as above football process

		if basketball_in_season == "true":
			
			collection_basketball_trifecta = "basketball_trifecta_" + year2
			basketball_count = db[collection_basketball_trifecta].count()
			#print basketball_count

			if basketball_count == 10:

				basketball_list = list(db[collection_basketball_trifecta].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}))
				
				for basketball_info in basketball_list:
					basketball_team = basketball_info["team"]
					basketball_points = basketball_info["total_trifecta_points"]
					#print basketball_team

					path = "teams." + basketball_team
					# print path
					while path.find(".", 6) != -1:
						period_index = path.find(".", 6)
						#print period_index
						path = path[:period_index] + "\uff0E" + path[period_index + 1:]
						basketball_team = basketball_team[:period_index - 6] + "\uff0E" + basketball_team[period_index + 1 - 6:]
						#print basketball_team	

					owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
					#print owner_check
					owner_name_check = owner_check["teams"][basketball_team]["owner"]
					#print owner_name_check

					if owner_name == owner_name_check:
						correct_team_name = basketball_team
						correct_trifecta_points = basketball_points

				basketball_trifecta_points = correct_trifecta_points
				print "basketball team name: ", correct_team_name
				print "basketball trifecta points: ", basketball_trifecta_points

			else:
				collection_basketball = "basketball_h2h_" + year2	

				basketball_list = list(db[collection_basketball].find({}, {"team": 1, "h2h_trifecta_points": 1, "_id": 0}))
				
				for basketball_info in basketball_list:
					basketball_team = basketball_info["team"]
					basketball_points = basketball_info["h2h_trifecta_points"]
					#print basketball_team

					path = "teams." + basketball_team
					#print path
					while path.find(".", 6) != -1:
					#if path.find(".", 6) != -1:
						period_index = path.find(".", 6)
						#print period_index
						path = path[:period_index] + "\uff0E" + path[period_index + 1:]
						basketball_team = basketball_team[:period_index - 6] + "\uff0E" + football_team[period_index + 1 - 6:]
						#print football_team					

					owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
					#print owner_check
					owner_name_check = owner_check["teams"][basketball_team]["owner"]
					#print owner_name_check

					if owner_name == owner_name_check:
						correct_team_name = basketball_team
						correct_trifecta_points = basketball_points

				basketball_trifecta_points = correct_trifecta_points
				print "basketball team name: ", correct_team_name
				print "basketball trifecta points: ", basketball_trifecta_points

		else: 
			basketball_trifecta_points = 0

##### Baseball #####

		# if baseball is in season (ie has data)
		if baseball_in_season == "true":
			
			collection_baseball_trifecta = "baseball_trifecta_" + year2
			baseball_count = db[collection_baseball_trifecta].count()
			#print baseball_count

			# if the number of documents in baseball trifecta is 10
			if baseball_count == 10:

				# just pull from total trifecta points from baseball tirfectacollection
				baseball_list = list(db[collection_baseball_trifecta].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}))
				
				# loop through listed results for team and trifecta points
				for baseball_info in baseball_list:
					baseball_team = baseball_info["team"]
					baseball_points = baseball_info["total_trifecta_points"]
					#print baseball_team

					# path to find owner from team name
					path = "teams." + baseball_team

					owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
					#print owner_check
					owner_name_check = owner_check["teams"][baseball_team]["owner"]
					#print owner_name_check

					# if owner names are the same, set correct team name and trifecta points
					if owner_name == owner_name_check:
						correct_team_name = baseball_team
						correct_trifecta_points = baseball_points

				baseball_trifecta_points = correct_trifecta_points
				print "baseball team name: ", correct_team_name
				print "baseball trifecta points: ", baseball_trifecta_points

			# if the sport trifecta collection is empty
			else:
				# will need to pull from h2h and roto to get proper trifecta points
				collection_baseball_h2h = "baseball_h2h_" + year2
				collection_baseball_roto	= "baseball_roto_" + year2

				# pull from h2h collection
				baseball_list = list(db[collection_baseball_h2h].find({}, {"team": 1, "h2h_trifecta_points": 1, "_id": 0}))
				
				for baseball_info in baseball_list:
					baseball_team = baseball_info["team"]
					baseball_points = baseball_info["h2h_trifecta_points"]
					#print baseball_team

					path = "teams." + baseball_team
					#print path
					if path.find(".", 6) != -1:
						period_index = path.find(".", 6)
						#print period_index
						path = path[:period_index] + "\uff0E" + path[period_index + 1:]
						baseball_team = baseball_team[:period_index - 6] + "\uff0E" + baseball_team[period_index + 1 - 6:]
						#print baseball_team		

					owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
					print owner_check
					owner_name_check = owner_check["teams"][baseball_team]["owner"]
					#print owner_name_check

					if owner_name == owner_name_check:
						correct_team_name = baseball_team
						correct_trifecta_points = baseball_points

				# divide h2h points by 2 to get proper weight for baseball trifecta points
				h2h_baseball_trifecta_points = float(correct_trifecta_points)
				print "baseball team name: ", correct_team_name
				print "h2h baseball trifecta points: ", h2h_baseball_trifecta_points

				# pull from roto collection
				baseball_list = list(db[collection_baseball_roto].find({}, {"team": 1, "roto_trifecta_points": 1, "_id": 0}))

				for baseball_info in baseball_list:
					baseball_team = baseball_info["team"]
					baseball_points = baseball_info["roto_trifecta_points"]
					#print baseball_team

					path = "teams." + baseball_team
					#print path

					if path.find(".", 6) != -1:
						period_index = path.find(".", 6)
						#print period_index
						path = path[:period_index] + "\uff0E" + path[period_index + 1:]
						baseball_team = baseball_team[:period_index - 6] + "\uff0E" + baseball_team[period_index + 1 - 6:]
						#print baseball_team						

					owner_check = list(db["owners_per_team_name"].find({}, {path: 1, "_id":0}))[0]
					#print owner_check
					print "baseball_team", baseball_team

					owner_name_check = owner_check["teams"][baseball_team]["owner"]
					#print owner_name_check

					if owner_name == owner_name_check:
						correct_team_name = baseball_team
						correct_trifecta_points = baseball_points			

				# divide roto points by 2 to get proper weight for baseball trifecta points
				roto_baseball_trifecta_points = float(correct_trifecta_points)
				#print "baseball team name: ", correct_team_name
				print "roto baseball trifecta points: ", roto_baseball_trifecta_points

				# sum h2h and roto halves to get total baseball trifecta points
				baseball_trifecta_points = h2h_baseball_trifecta_points + roto_baseball_trifecta_points

		# if baseball is not in season, give 0 baseball trifecta points to every owner
		else:
			baseball_trifecta_points = 0

		# summ all sports to get total trifecta points
		total_trifecta_points = football_trifecta_points + basketball_trifecta_points + baseball_trifecta_points

		# fill dictionary with values to upload
		input_json["owner"] = owner_name
		input_json["football"] = football_trifecta_points
		input_json["basketball"] = basketball_trifecta_points
		input_json["baseball"] = baseball_trifecta_points
		input_json["total_trifecta_points"] = total_trifecta_points

		print input_json
		print ""

		# append to list for 1 upload
		trifecta_upload.append(input_json)

	print trifecta_upload

	# upload all to trifecta collection
	db[collection_season_trifecta].insert(trifecta_upload)

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
year1 = str(sys.argv[1])
year2 = str(sys.argv[2])

football_in_season = str(sys.argv[3])
basketball_in_season = str(sys.argv[4])
baseball_in_season = str(sys.argv[5])


trifectaSeasonPoints(db, year1, year2, football_in_season, basketball_in_season, baseball_in_season)
