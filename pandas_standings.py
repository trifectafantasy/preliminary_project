from pymongo import MongoClient
import subprocess
import time
import numpy as np 
import pandas as pd 

def h2h_trifecta(collection):

	sorted_h2h = list(collection.find({}, {"team": 1, "win_per": 1, "_id": 0}).sort("win_per", -1))

	#print sorted_h2h

	team_list = []
	win_per_list = []
	for i in range(len(sorted_h2h)):

		team_input = sorted_h2h[i]["team"]
		win_per_input = sorted_h2h[i]["win_per"]

		team_list.append(team_input)
		win_per_list.append(win_per_input)

	print team_list
	print win_per_list





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
#roto_trifecta(collection2)

print "Putting subprocess to sleep, then killing it"
time.sleep(5)
mongod.terminate()
