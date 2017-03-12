##### IMPORT LIBRARIES ######
from pymongo import MongoClient
import subprocess
import time
import sys
from collections import OrderedDict

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
time.sleep(1)
# define collections to be used
collection_trophy = "trophy_list"

print "-----Distribute Trophies-----"

# while loop and try block to handle KeyboardInterrupt
while True:
	try:
		# create dictionary of each trophy and associated selection number
		selection_dictionary = {}
		selection_count = 1

		owner_number = raw_input("Owner Number: ")
		sport = raw_input("Sport: ")
		if sport == "trifecta":
			year = raw_input("Year 2 of Trifecta Season: ")
		else:
			year = raw_input("Year: ")

		# pull from collection of all trophy possibilities according to sport
		trophy_possibilities = list(db[collection_trophy].find({"sport": sport}, {"name": 1, "_id": 0}))

		# print possibilities and create dictionary with selection numbers and trophy names for selection
		for i in trophy_possibilities:
			trophy = i["name"]
			print selection_count, ":", trophy
			selection_dictionary["trophy" + str(selection_count)] = trophy

			selection_count += 1
		#print selection_dictionary

		# enter trophy number selection
		trophy_number = raw_input("Trophy Number: ")

		# validation check
		if 0 < int(trophy_number) < int(selection_count):
			trophy_won = selection_dictionary["trophy" + trophy_number]
			print trophy_won
		else:
			print "Please enter a valid trophy number"

		# pull description and add extra description as necessary
		trophy_description = list(db[collection_trophy].find({"sport": sport, "name": trophy_won}, {"description": 1, "_id": 0}))
		trophy_description = trophy_description[0]["description"]
		print trophy_description
		extra_description = raw_input("Any extra description? ")
		trophy_description += extra_description
		#print repr(trophy_description)

		insert_json = OrderedDict()

		# order not of trifecta seasons but in which they occur per year
		if sport == "football":
			season_order = "3"
		elif sport == "basketball":
			season_order = "1"
		elif sport == "baseball":
			season_order = "2"
		elif sport == "trifecta":
			season_order = "2.5"

		# create date "year+order"
		insert_json["date"] = float(year + season_order)
		if sport == "trifecta":
			insert_json["season"] = sport.capitalize() + " " + str(int(year) - 1) + "-" + year
		else:
			insert_json["season"] = sport.capitalize() + " " + year
		insert_json["name"] = trophy_won
		insert_json["description"] = trophy_description
		print insert_json

		# add to owner trophy collection
		db["owner" + owner_number + "_trophies"].insert(insert_json)
		print "Trophy inserted"
		print ""

	except KeyboardInterrupt:
		print "Goodbye"
		# sleep and terminate mongodb instance
		time.sleep(.5)
		mongod.terminate()
		break
