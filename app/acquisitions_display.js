///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

module.exports = function(req, res, db, sport, year, owner_number) {

	if (owner_number == 'all') {

		var owner = 'all';

		// send to script that compiles all owners' acquisitions
		var all_js = require('./all_acquisitions.js')(req, res, db, sport, year, function(err, call){
			console.log("update complete");

			// pull database for display
			db.collection(sport + "_acquisitions_" + year + "_all").find({}, {"_id": 0}, {"sort": [["acquisition_value", "desc"], ["weighted_PR", "desc"], ["acquisition_weight", "asc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("displaying all acquisition stats...");
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

				res.render(sport + '_acquisitions', {
					year: year,
					acquisitions: disp_acquisitions,
					owner: owner
				})
			}) // end of collection pull for display
		}) // end of script for all acquisitions	

	}

	else {
		// pull owner acquisition database for display
		db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).find({}, {"_id": 0}, {"sort": [["acquisition_value", "desc"], ["PTS", "desc"], ["acquisition_weight", "asc"]]}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("displaying acquisition stats...");
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

			// pull owner nanme for pug display
			db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs2) {

				owner_name = docs2[0]["owner"];

				res.render(sport + '_acquisitions', {
					year: year,
					owner: owner_name,
					acquisitions: disp_acquisitions
				})
			}) // end of owner database find
		}) // end of acquisition find for display				
	} // end of if individual owner				



}