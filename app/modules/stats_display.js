///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

module.exports = function(req, res, db, sport, year, owner_number) {

	let find_query = {"acquired": 0, "draft_position": 0, "acquisition_weight": 0, "acquisition_value": 0, "_id": 0};

	if (sport === 'football') {
		let sort_query = {"sort": [["PTS", "desc"]]};

		if (owner_number === 'all') {
			all_stats_display(find_query, sort_query);
		}
		else {
			individual_stats_display(find_query, sort_query);
		}		
	}
	else {
		let sort_query = {"sort": [["weighted_PR", "desc"]]};

		if (owner_number === 'all') {
			all_stats_display(find_query, sort_query);
		}
		else {
			individual_stats_display(find_query, sort_query);
		}
	}

// functions defined in module for display //

	function all_stats_display(find_query, sort_query) {

		let owner = 'all';

		// send to script that compiles all owners' acquisitions
		var all_js = require('./all_acquisitions.js')(req, res, db, sport, year, function(err, call){
			console.log("update complete");

			// pull database for display
			db.collection(sport + "_acquisitions_display_" + year + "_all").find({}, find_query, sort_query).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying all roster stats...");
				console.log("");
				disp_acquisitions = docs;

				// loop from back to front of pulled array
				for (i = disp_acquisitions.length - 1; i >= 0; i--) {
					var move_back = "";

					// if player is from a trade, move to back
					if (disp_acquisitions[i]["acquired"] == "Trade") {

						// set moved element
						move_back = disp_acquisitions[i];

						// remove this indexed element
						disp_acquisitions.splice(i, 1);

						// add moved element to back
						disp_acquisitions.push(move_back);
					}
				} // end of for loop for sorting

				setTimeout(function() {

					res.render(sport + '_stats', {
						year: year,
						acquisitions: disp_acquisitions,
						owner: owner
					})
				}, 1000) // end of setTimeout
			}) // end of collection pull for display
		}) // end of script for all acquisitions	
	} // end of all_stats_display

	function individual_stats_display(find_query, sort_query) {
		// pull owner acquisition database for display
		db.collection("owner" + owner_number + "_" + sport + "_acquisitions_display_" + year).find({}, find_query, sort_query).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying roster stats...");
			console.log("");
			disp_acquisitions = docs;

			// loop from back to front of pulled array
			for (i = disp_acquisitions.length - 1; i >= 0; i--) {
				var move_back = "";

				// if player is from a trade, move to back
				if (disp_acquisitions[i]["acquired"] == "Trade") {

					// set moved element
					move_back = disp_acquisitions[i];

					// remove this indexed element
					disp_acquisitions.splice(i, 1);

					// add moved element to back
					disp_acquisitions.push(move_back);
				}
			}

			setTimeout(function() {

				// pull owner nanme for pug display
				db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs2) {
					owner_name = docs2[0]["owner"];

					res.render(sport + '_stats', {
						year: year,
						owner: owner_name,
						acquisitions: disp_acquisitions
					})
				}) // end of owner database find
			}, 1000) // end of setTimeout						
		}) // end of acquisition find for display
	} // end of individual_stats_display

} // end of module experts