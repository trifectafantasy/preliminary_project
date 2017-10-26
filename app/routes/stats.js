///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function stats(req, res, db, args) {

	let sport = args.sport;
	let year = args.year;
	let owner_number = args.owner_number;
	let completed_sport_season = args.completed_sport_season;

	if (sport === 'football') {
		acquire_process();
	}
	else {
		// scrape PR once for basketball and baseball
		var pr_scrape = require('../modules/' + sport + '_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
			console.log("PR scrape done");

			acquire_process();
		})
	}

// function that does all of the acquisition process except for PR scrape
var acquire_process = function() {

	// if year is greater than what's been completed, scrape
	if (year > completed_sport_season) {

		if (owner_number === 'all') {
			
			// scrape draft once
			var draft = require('../modules/draft.js')(req, res, db, sport, year, function(err, call4) {
				console.log("drafted players done");

				// set array of numbers
				var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

				// call function that synchronously loops through acquistions for each team
				all_acquisitions(0, owner_list);
				
			}) // end of draft scrape			
		}

		else {
			// send to script that adds drafted players
			var draft = require('../modules/draft.js')(req, res, db, sport, year, function(err, call2) {
				console.log("drafted players done");			
			
				// send to script that pulls active stats
				var active_stats = require('../modules/' + sport + '_active_stats.js')(req, res, db, sport, year, owner_number, function(err, football_owner_number) {
					console.log("active stats scrape done");

					// send to script that adds added players
					var add = require('../modules/' + sport + '_add.js')(req, res, db, sport, year, owner_number, function(err, call) {
						console.log("added players done");

						var auxiliary = require('../modules/' + sport + '_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call4) {
							console.log("aux stats complete");

							var options = {
								args: [sport, year, owner_number]
							}

							// python script that determines acqusition value
							pyshell.run(sport + '_acquisitions.py', options, function(err) {
								console.log("acquisition python script complete");
								var acquisitions_display = require('../modules/stats_display.js')(req, res, db, sport, year, owner_number)			
							}) // end of python script
						}) // end of aux
					}) // end of football draft script
				}) // end of football add script
			})	// end of footbabll draft			
		}
	}
	// if don't need to scrape, just pull, sort and display
	else {

		var stats_display = require('../modules/stats_display.js')(req, res, db, sport, year, owner_number)

	} // end of if don't need to scrape, just dispaly
} // end of acquire_process function

// function that synchronously updates acquisitions for each team
var all_acquisitions = function(x, owner_list) {

	if (x < owner_list.length) {

		owner_number = owner_list[x];
		console.log("owner number", owner_number);

		var active_stats = require('../modules/' + sport + '_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
			console.log("active stats scrape done");

			var add = require('../modules/' + sport + '_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
				console.log("added players done");

				var aux = require('../modules/' + sport + '_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
					console.log("aux stats added");

					var options = {
						args: [sport, year, owner_number]
					}

					pyshell.run(sport + '_acquisitions.py', options, function(err) {
						console.log("acquisitions python script complete");

						all_acquisitions(x + 1, owner_list);
					
					}) // end of pyshell 
				}) // end of football auxiliary
			}) // end of football add 
		}) // end of active stats
	}

	// if done with all the owners in owners_list
	else {
		// reset owner number (after it has gone through loop) to all for all display
		owner_number = 'all';
		var acquisitions_display = require('../modules/stats_display.js')(req, res, db, sport, year, owner_number)			
	}
} // end of all_football_acquisitions function

} // end of stats module

module.exports = {
	stats
}