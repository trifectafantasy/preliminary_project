///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');
var forEach = require('async-foreach').forEach;

var mongo = require('mongodb');
var assert = require('assert');

// create callback function
module.exports = function(req, res, db, sport, year, owner_number, callback) {

	var finish_one = 0;
	var basketball_pr_picks, basketball_draft_picks, number_of_owners

	// pull team names from specific owner
	db.collection('owner' + owner_number).find({}, {"teams": 1, "_id": 0}).toArray(function(e, docs) {

		team_list = docs[0]["teams"]
		//console.log(team_list);

		// pull draft collection
		db.collection(sport + "_draft_" + year).find({}).toArray(function(e, docs2) {

			draft_pull = docs2;
			//console.log(draft_pull);

			// loop through each draft pick
			draft_pull.forEach(function(draft_pick, index) {

				team = draft_pick["team"]
				//console.log(team);

				// if the drafted players' team is correct
				if (team_list.indexOf(team) != -1) {
				//if (team_list.includes(team)) {

					player = draft_pick["player"]
					draft_position = draft_pick["draft_position"]
					//console.log(player);
					//console.log(draft_position);

					// if drafted update with draft and draft position
		 			db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).update({"player": player}, {"$set": {"acquired": "Draft", "draft_position": draft_position}}, {upsert: true})
		 			one_done();
				}
			}) // end of iteration through all draft selection
		}) // end of draft add
	}) // end of owner number find


	// synchronous for loop for adding PR to each team
	var add_pr = function(x, team_pull) {

		if (x < team_pull.length) {
			//console.log(team_pull);
			player = team_pull[x]["player"]
			//console.log(player);

			db.collection(sport + "_pr_" + year).find({"player": player}, {"PR": 1, "_id": 0}).toArray(function(e, docs1) {

				// handle if there is PR for a player (stash)
				if (docs1.length == 0) {
					pr = 0.0
				}
				else {
					pr = docs1[0]["PR"]
				}
				//console.log(pr);

				// update player with their PR
			 	db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).update({"player": player}, {"$set": {"PR": pr}})

				add_pr(x + 1, team_pull);
			}) // end of pr pull
		}

		else {
			callback();
		}
	} // end of add_pr function

	// check for when updating draft position done
	var one_done = function() {

		// count number of documents to know when to stop 
		db.collection(sport + "_draft_" + year).count({}, function(err, num1){
			
			basketball_draft_picks = num1;
			number_of_owners = 10;
			finish_one += 1
			//console.log(finish_one);
			//console.log(basketball_draft_picks);

			// if number of draft picks per team
			if (finish_one == Math.ceil(basketball_draft_picks / number_of_owners)) {

				// pull all players per team to add PR to them
			 	db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).find({}, {"player": 1, "_id": 0}).toArray(function(e, docs) {
			 		team_pull = docs;
			 		add_pr(0, team_pull);
			 	}) // end of team acquisition pull
			} // end of if
		})	// end of count of team acquisition

	} // end of one_done function

}

// Have to modify manually as in transaction log have no *, but in roster summary, do have *
/*
db.owner4_basketball_acquisitions_2016.update({"player":"Andrew Bogut*"}, {"$set":{"acquired":"FA"}})
db.owner4_basketball_acquisitions_display_2016.update({"player":"Andrew Bogut*"}, {"$set":{"acquired":"FA"}})
db.owner4_basketball_acquisitions_2016.update({"player":"Bismack Biyombo*"}, {"$set":{"acquired":"FA"}})
db.owner4_basketball_acquisitions_display_2016.update({"player":"Bismack Biyombo*"}, {"$set":{"acquired":"FA"}})

db.owner9_basketball_acquisitions_display_2016.update({"player":"Kelly Olynyk*"}, {"$set":{"acquired":"FA"}})
db.owner9_basketball_acquisitions_2016.update({"player":"Kelly Olynyk*"}, {"$set":{"acquired":"FA"}})
db.owner9_basketball_acquisitions_display_2016.update({"player":"Mario Chalmers*"}, {"$set":{"acquired":"FA"}})
db.owner9_basketball_acquisitions_2016.update({"player":"Mario Chalmers*"}, {"$set":{"acquired":"FA"}})

db.owner8_basketball_acquisitions_2016.update({"player":"Andrew Bogut*"}, {"$set":{"acquired":"FA"}})
db.owner8_basketball_acquisitions_display_2016.update({"player":"Andrew Bogut*"}, {"$set":{"acquired":"FA"}})
db.owner8_basketball_acquisitions_2016.update({"player":"Bismack Biyombo*"}, {"$set":{"acquired":"FA"}})
db.owner8_basketball_acquisitions_display_2016.update({"player":"Bismack Biyombo*"}, {"$set":{"acquired":"FA"}})
*/