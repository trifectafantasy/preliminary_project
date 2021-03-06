///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

module.exports = function(req, res, db, sport, year, callback) {

	// list of owner numbers
	var number_of_owners = 10;
	var owner_list = [];
	for (var i=1; i<=number_of_owners; i++) {
		owner_list.push(i.toString());
	}	

	var complete_count = 0;
	var total_count = 0;

	// clear sport acquisition all collection
	db.collection(sport + "_acquisitions_display_" + year + "_all").remove({}, function(err, results) {

		// for each owner
		owner_list.forEach(function(owner_number, index) {

			// count number of documents/players per owner 
			db.collection("owner" + owner_number + "_" + sport + "_acquisitions_display_" + year).count({}, function(err, num) {
				total_count += num;
			})			

			// pull down each owner's acquisition collection to add owner's name
			db.collection("owner" + owner_number + "_" + sport + "_acquisitions_display_" + year).find({}, {"_id": 0}).toArray(function(e, docs) {
				
				//console.log(docs);
				var team_pull = docs;

				// pull to convert owner number to owner name
				db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(err, owner_name) {
					owner = owner_name[0]["owner"];
					//console.log(owner);

					// for each player per owner, add owner name
					for (i = 0; i < team_pull.length; i++) {
						//console.log(team_pull[i]);

						var player_pull = team_pull[i];
						player_pull["owner"] = owner;
						//console.log(player_pull);

						// add into all acquisition collection
						db.collection(sport + "_acquisitions_display_" + year + "_all").insert(player_pull);

						// each time done, call complete to see when done
						complete();
					} // end of for loop to add owner name				
				}) // end of owner name pulls
			}) // end of acquisitions display pull
		}) // end of forEach iterations for each owner
	}) // end of remove to clear collection

// complete function to when each player on each owner is done
var complete = function() {
	complete_count += 1;

	// give total and complete count a chance to initialize
	// (total count = each owner's number of players)
	if (complete_count != 0 && total_count != 0) {

		if (complete_count == total_count) {
			//console.log("donezo")
			callback();
		}
	}
} // end of complete function

}
