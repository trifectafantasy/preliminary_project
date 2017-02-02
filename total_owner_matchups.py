##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

##### DEFINE FUNCTIONS #####

# function that combines data from all matchup collections for total season trifecta owner matchup standings
def matchupRecords(db, owner_number, completed_football_season, football_in_season, completed_basketball_season, basketball_in_season,  completed_baseball_season, baseball_in_season):



	collection_owner = "owner" + owner_number
	owner_name = list(db[collection_owner].find({}, {"owner": 1, "_id": 0}))[0]["owner"]
	print "owner: ", owner_name



	collection_owner_football = "owner" + owner_number + "_football_matchups_all"
	db[collection_owner_football].remove({})

	# set range of available seasons for each sport
	starting_football_season = 2015;

	if football_in_season == "true":
		# add 2 because range is exclusive on back end
		ending_football_season = int(completed_football_season) + 2
	else:
		# add 1 because end parameter in range is exclusive
		ending_football_season = int(completed_football_season) + 1

	football_seasons = range(starting_football_season, ending_football_season)
	#print football_seasons



	collection_owner_list = "owner" + owner_number + "_football_matchups_" + str(ending_football_season - 1)
	owner_pull = list(db[collection_owner_list].find({}, {"opposing_owner": 1, "_id": 0}))

	for opposing_owner_list in owner_pull:

		football_json = OrderedDict();

		wins_upload = 0.0
		losses_upload = 0.0
		ties_upload = 0.0
		win_per_upload = 0.0
		PF_upload = 0.0
		PA_upload = 0.0
		pt_diff_upload = 0.0

		opposing_owner = opposing_owner_list["opposing_owner"]
		#print "opposing owner: ", opposing_owner

		for football_year in football_seasons:

			collection_football = "owner" + owner_number + "_football_matchups_" + str(football_year)
			football_pull = list(db[collection_football].find({"opposing_owner": opposing_owner}, {"_id": 0}))
			#print football_pull

			wins_upload += football_pull[0]["wins"]
			losses_upload += football_pull[0]["losses"]
			ties_upload += football_pull[0]["ties"]
			win_per_upload = (wins_upload + (ties_upload / 2)) / (wins_upload + losses_upload + ties_upload)

			PF_upload += football_pull[0]["PF"]
			PA_upload += football_pull[0]["PA"]
			pt_diff_upload = PF_upload - PA_upload

		"""
		print wins_upload
		print losses_upload
		print ties_upload
		print win_per_upload
		print PF_upload
		print PA_upload
		print pt_diff_upload
		"""

		football_json["opposing_owner"] = opposing_owner
		football_json["wins"] = wins_upload
		football_json["losses"] = losses_upload
		football_json["ties"] = ties_upload
		football_json["win_per"] = round(win_per_upload, 3)
		football_json["PF"] = round(PF_upload, 1)
		football_json["PA"] = round(PA_upload, 1)
		football_json["pt_diff"] = round(pt_diff_upload, 1)

		db[collection_owner_football].insert(football_json)


	collection_owner_basketball = "owner" + owner_number + "_basketball_matchups_all"
	db[collection_owner_basketball].remove({})

	starting_basketball_season = 2016;

	if basketball_in_season == "true":
		# add 2 because range is exclusive on back end
		ending_basketball_season = int(completed_basketball_season) + 2
	else:
		# add 1 because end parameter in range is exclusive
		ending_basketball_season = int(completed_basketball_season) + 1

	basketball_seasons = range(starting_basketball_season, ending_basketball_season)
	#print basketball_seasons

	for opposing_owner_list in owner_pull:

		basketball_json = OrderedDict()

		wins_upload = 0.0
		losses_upload = 0.0
		ties_upload = 0.0
		win_per_upload = 0.0

		opposing_owner = opposing_owner_list["opposing_owner"]
		#print "opposing owner: ", opposing_owner

		for basketball_year in basketball_seasons:		

			collection_basketball = "owner" + owner_number + "_basketball_matchups_" + str(basketball_year)
			basketball_pull = list(db[collection_basketball].find({"opposing_owner": opposing_owner}, {"_id": 0}))
			#print basketball_pull

			wins_upload += basketball_pull[0]["wins"]
			losses_upload += basketball_pull[0]["losses"]
			ties_upload += basketball_pull[0]["ties"]
			win_per_upload = (wins_upload + (ties_upload / 2)) / (wins_upload + losses_upload + ties_upload)


		"""
		print wins_upload
		print losses_upload
		print ties_upload
		print win_per_upload
		"""

		basketball_json["opposing_owner"] = opposing_owner
		basketball_json["wins"] = wins_upload
		basketball_json["losses"] = losses_upload
		basketball_json["ties"] = ties_upload
		basketball_json["win_per"] = round(win_per_upload, 3)

		db[collection_owner_basketball].insert(basketball_json)




	collection_owner_baseball = "owner" + owner_number + "_baseball_matchups_all"
	db[collection_owner_baseball].remove({})

	starting_baseball_season = 2016;

	if baseball_in_season == "true":
		# add 2 because range is exclusive on back end
		ending_baseball_season = int(completed_baseball_season) + 2
	else:
		# add 1 because end parameter in range is exclusive
		ending_baseball_season = int(completed_baseball_season) + 1

	baseball_seasons = range(starting_baseball_season, ending_baseball_season)
	print baseball_seasons

	for opposing_owner_list in owner_pull:

		baseball_json = OrderedDict()

		wins_upload = 0.0
		losses_upload = 0.0
		ties_upload = 0.0
		win_per_upload = 0.0

		opposing_owner = opposing_owner_list["opposing_owner"]
		print "opposing owner: ", opposing_owner

		for baseball_year in baseball_seasons:

			print baseball_year		

			collection_baseball = "owner" + owner_number + "_baseball_matchups_" + str(baseball_year)
			baseball_pull = list(db[collection_baseball].find({"opposing_owner": opposing_owner}, {"_id": 0}))
			#print baseball_pull

			wins_upload += baseball_pull[0]["wins"]
			losses_upload += baseball_pull[0]["losses"]
			ties_upload += baseball_pull[0]["ties"]
			win_per_upload = (wins_upload + (ties_upload / 2)) / (wins_upload + losses_upload + ties_upload)


		"""
		print wins_upload
		print losses_upload
		print ties_upload
		print win_per_upload
		"""

		baseball_json["opposing_owner"] = opposing_owner
		baseball_json["wins"] = wins_upload
		baseball_json["losses"] = losses_upload
		baseball_json["ties"] = ties_upload
		baseball_json["win_per"] = round(win_per_upload, 3)

		db[collection_owner_baseball].insert(baseball_json)

	

	# set tifecta matchups collection and clear it to initialze
	collection_owner_matchups_all = "owner" + owner_number + "_trifecta_matchups_all"
	db[collection_owner_matchups_all].remove({})


	for opposing_owner_list in owner_pull:

		insert_json = OrderedDict()

		football_win_per = 0.0
		basketball_win_per = 0.0
		baseball_win_per = 0.0
		total_win_per = 0.0

		opposing_owner = opposing_owner_list["opposing_owner"]
		#print "opposing owner: ", opposing_owner

		# pull individual football matchup win_per
		football_pull = list(db[collection_owner_football].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
		#print football_pull
		football_win_per = football_pull[0]["win_per"]
		print "football:", football_win_per

		# pull individual baasketball matchup win_per
		basketball_pull = list(db[collection_owner_basketball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
		#print basketball_pull
		basketball_win_per = basketball_pull[0]["win_per"]
		print "basketball: ", basketball_win_per

		# pull individual baseball matchup win_per
		baseball_pull = list(db[collection_owner_baseball].find({"opposing_owner": opposing_owner}, {"win_per": 1, "_id": 0}))
		#print baseball_pull
		baseball_win_per = baseball_pull[0]["win_per"]
		print "baseball: ", baseball_win_per			

		# calculate averaged total win_per
		total_win_per = (football_win_per + basketball_win_per + baseball_win_per) / 3
		total_win_per = round(total_win_per, 3)
		print "total: ", total_win_per

		# insert into ordered dictionary for input
		insert_json["opposing_owner"] = opposing_owner
		insert_json["football_win_per"] = football_win_per
		insert_json["basketball_win_per"] = basketball_win_per
		insert_json["baseball_win_per"] = baseball_win_per
		insert_json["total_win_per"] = total_win_per

		# add into matchup collection
		db[collection_owner_matchups_all].insert(insert_json)




				
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
owner_number = str(sys.argv[1])

completed_football_season = str(sys.argv[2])
football_in_season = str(sys.argv[3])

completed_basketball_season = str(sys.argv[4])
basketball_in_season = str(sys.argv[5])

completed_baseball_season = str(sys.argv[6])
baseball_in_season = str(sys.argv[7])

matchupRecords(db, owner_number, completed_football_season, football_in_season, completed_basketball_season, basketball_in_season,  completed_baseball_season, baseball_in_season)

# sleep and terminate mongodb instance
time.sleep(3)
mongod.terminate()