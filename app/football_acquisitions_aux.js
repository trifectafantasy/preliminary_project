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
	var basketball_draft_picks, number_of_owners

	// pull team names from specific owner
	db.collection('owner' + owner_number).find({}, {"teams": 1, "_id": 0}).toArray(function(e, docs) {

		team_list = docs[0]["teams"]
		//console.log(team_list);

		// pull draft collection
		db.collection(sport + "_draft_" + year).find({}).toArray(function(e, docs2) {

			draft_pull = docs2;
			//console.log(draft_pull)

			// loop through each draft pick
			draft_pull.forEach(function(draft_pick, index) {

				team = draft_pick["team"]
				//console.log(team)

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


	// check for when updating draft position done
	var one_done = function() {

		// count number of documents to know when to stop 
		db.collection(sport + "_draft_" + year).count({}, function(err, num1){
			
			basketball_draft_picks = num1;
			number_of_owners = 10;
			finish_one += 1

			// if number of draft picks per team
			if (finish_one == (basketball_draft_picks / number_of_owners)) {

				callback();
			} // end of if
		})	// end of count of team acquisition

	} // end of one_done function

}

