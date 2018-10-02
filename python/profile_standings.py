##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict
import math

##### DEFINE FUNCTIONS #####

# function that gets the trifecta standings and inserts individual owner's standing into profile_standings database
def	trifecta_summary(db, owner_number, year1, year2):

	insert_json = OrderedDict()

	owner_name = list(db["owner" + owner_number].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	#print owner_name

	trifecta_pull = list(db["trifecta_" + str(year1) + "_" + str(year2)].find({}, {"owner": 1, "total_trifecta_points": 1, "_id": 0}).sort("total_trifecta_points", -1))
	#print trifecta_pull

	# initialize counting variables
	rank = 0
	saved_points = 0
	last_points = 0
	tie_teams = 0	
	
	# iterate for each owner's trifecta standings
	for each_owner in trifecta_pull:
		owner = each_owner["owner"]
		trifecta_points = each_owner["total_trifecta_points"]

		# assigning rank depending on number of trifecta points
		rank += 1

		if last_points == trifecta_points:
			rank -= 1
			tie_teams += 1
		else:
			rank += tie_teams
			tie_teams = 0

		last_points = trifecta_points

		if owner == owner_name:
			saved_owner = owner
			saved_points = trifecta_points
			saved_rank = rank

			#print "owner", owner
			#print "trifecta rank", rank
			#print "trifecta points", trifecta_points	
	
	insert_json["season"] = "Trifecta " + str(year1) + "-" + str(year2)
	insert_json["team"] = owner_name
	insert_json["sport_rank"] = saved_rank
	insert_json["sport_trifecta_points"] = saved_points
	insert_json["win_per"] = "N/A"
	insert_json["roto_points"] = "N/A"

	print "Trifecta " + str(year1) + "-" + str(year2)
	print insert_json
	print ""

	db["owner" + owner_number + "_profile_standings"].insert(insert_json)


# function that combines data from all matchup collections for total season trifecta owner matchup standings
def profiling(db, owner_number, team_list, sport, year):

	print sport, year
	year = str(year)

	insert_json = OrderedDict()

	if sport == "baseball":

		# pull trifecta data sport and year
		sport_trifecta_pull = list(db[sport + "_trifecta_" + year].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}).sort("total_trifecta_points", -1))
		#print sport_trifecta_pull

		# initialize counting variables
		rank = 0
		saved_points = 0
		last_points = 0
		tie_teams = 0

		# for each team's trifecta data
		for each_team in sport_trifecta_pull:
			team = each_team["team"]
			sport_trifecta_points = each_team["total_trifecta_points"]

			# assign rank depending on total trifecta points
			rank += 1

			if last_points == sport_trifecta_points:
				rank -= 1
				tie_teams += 1
			else:
				rank += tie_teams
				tie_teams = 0

			last_points = sport_trifecta_points

			if team in team_list:
				saved_team = team
				saved_points = sport_trifecta_points
				saved_rank = rank

				#print "team", team
				#print sport, "rank", rank
				#print "trifecta points", sport_trifecta_points

		# pull h2h win percentage
		sport_h2h_pull = list(db[sport + "_h2h_" + year].find({}, {'team': 1, 'win_per': 1, "_id": 0}))
		#print sport_h2h_pull

		# loop through each team and if right one, pull win_per
		for each_h2h in sport_h2h_pull:
			team = each_h2h["team"]

			if team in team_list:
				sport_h2h = each_h2h["win_per"]
				#print sport, "win per", sport_h2h

		# pull roto points
		sport_roto_pull = list(db[sport + "_roto_" + year].find({}, {"team": 1, "total_roto_points": 1, "_id": 0}))
		#print sport_roto_pull

		# loop through each team and if right one, pull total roto points
		for each_roto in sport_roto_pull:
			team = each_roto["team"]

			if team in team_list:
				sport_roto = each_roto["total_roto_points"]
				#print sport, "roto points", sport_roto

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["team"] = saved_team
		insert_json["sport_rank"] = saved_rank
		insert_json["sport_trifecta_points"] = saved_points
		insert_json["win_per"] = sport_h2h
		insert_json["roto_points"] = sport_roto

		print insert_json
		db["owner" + owner_number + "_profile_standings"].insert(insert_json)

	# if sport is football or basketball (no roto)
	else:

		# pull sport trifecta points
		sport_trifecta_pull = list(db[sport + "_trifecta_" + year].find({}, {"team": 1, "total_trifecta_points": 1, "_id": 0}).sort("total_trifecta_points", -1))
		#print sport_trifecta_pull

		# initialize counting variables
		rank = 0
		saved_points = 0
		last_points = 0
		tie_teams = 0

		# loop through each team's trifecta points
		for each_team in sport_trifecta_pull:
			team = each_team["team"]
			sport_trifecta_points = each_team["total_trifecta_points"]

			# assign rank depending on total trifecta points
			rank += 1

			if last_points == sport_trifecta_points:
				rank -= 1
				tie_teams += 1
			else:
				rank += tie_teams
				tie_teams = 0

			last_points = sport_trifecta_points

			if team in team_list:
				saved_team = team
				saved_points = sport_trifecta_points
				saved_rank = rank

				#print "team", team
				#print sport, "rank", rank
				#print "trifecta points", sport_trifecta_points

		# pull h2h collections for win_per
		sport_h2h_pull = list(db[sport + "_h2h_" + year].find({}, {'team': 1, 'win_per': 1, "_id": 0}))
		#print sport_h2h_pull

		# loop through each team's h2h data
		for each_h2h in sport_h2h_pull:
			team = each_h2h["team"]

			if team in team_list:
				sport_h2h = each_h2h["win_per"]
				#print sport, "win per", sport_h2h

		insert_json["season"] = sport.capitalize() + " " + year
		insert_json["team"] = saved_team
		insert_json["sport_rank"] = saved_rank
		insert_json["sport_trifecta_points"] = saved_points
		insert_json["win_per"] = sport_h2h
		insert_json["roto_points"] = "N/A"

		print insert_json				
		db["owner" + owner_number + "_profile_standings"].insert(insert_json)

	print ""


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
start_year = int(sys.argv[2])
end_year = int(sys.argv[3])
football_completed_season = str(sys.argv[4])
basketball_completed_season = str(sys.argv[5])
baseball_completed_season = str(sys.argv[6])

db["owner" + owner_number + "_profile_standings"].remove({})

# for this particular owner, pull all their fantasy team names used
team_list = list(db["owner" + owner_number].find({}, {"teams": 1, "_id": 0}))[0]["teams"]
print team_list

sports_list = ["football", "basketball", "baseball"]

# loop through each year we've played
start_year_list = range(start_year, end_year)
# set year 1 and year 2
for year1 in start_year_list:
	year2 = year1 + 1

	# if current trifecta season
	if year2 == end_year:
		# loop through each sport in order
		for sport in sports_list:
			# if baseball done, profile all sport and set correct year
			if baseball_completed_season == "true":
				if sport == "football":
					year = year1
					profiling(db, owner_number, team_list, sport, year)
				elif sport == "basketball":
					year = year2
					profiling(db, owner_number, team_list, sport, year)
				elif sport == 'baseball':
					year = year2
					profiling(db, owner_number, team_list, sport, year)

					# if baseball is done, then also do trifeta summary
					trifecta_summary(db, owner_number, year1, year2)
					
			# if basketball done, profile basketball and football
			elif basketball_completed_season == "true":
				if sport == "football":
					year = year1
					profiling(db, owner_number, team_list, sport, year)
				elif sport == "basketball":
					year = year2
					profiling(db, owner_number, team_list, sport, year)
			# if football done, profile football
			elif football_completed_season == "true":
				if sport == "football":
					year = year1
					profiling(db, owner_number, team_list, sport, year)

	# if trifecta season in past (all done)
	else:
		for sport in sports_list:
			# proile each sport and set correct
			if sport == "football":
				year = year1
				profiling(db, owner_number, team_list, sport, year)
			elif sport == "basketball":
				year = year2
				profiling(db, owner_number, team_list, sport, year)
			elif sport == "baseball":
				year = year2
				profiling(db, owner_number, team_list, sport, year)

				# if baseball is done, then also do trifeta summary
				trifecta_summary(db, owner_number, year1, year2)
