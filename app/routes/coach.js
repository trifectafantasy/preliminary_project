///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function coach(req, res, db, args) {

	let year = args.year;
	let completed_football_season = args.completed_football_season;
	let completed_weeks = args.completed_weeks;
	let football_ahead = args.football_ahead;
	let football_ahead_completed_matchups = args.football_ahead_completed_matchups;
	
// function that executes synchronous scrapes and python script analyses
var all_football_coach = function(x, owner_list) {
	if (x < owner_list.length) {
		// set owner number
		owner_number = owner_list[x];
		console.log("owner number", owner_number);

		// scrape starting lineups and benches from each week
		var coach_scrape = require('../modules/coach_scrape.js')(req, res, db, year, owner_number, completed_weeks, function(err, call) {
			console.log("coach scrape done");

			// send back to loop again
			all_football_coach(x + 1, owner_list);
		}) // end of coach scrape script
	}
	// once done with all in loop, done
	else {
		var options = {
			args: [year, completed_weeks]
		}
		pyshell.run('python/football_coach.py', options, function(err) {
			if (err) throw err;
			console.log("coach python script done");

			// delay 2 seconds to let database populate
			setTimeout(function() {
				// pull from collection for display
				db.collection("all_coach_" + year).find({}, {"_id": 0}).sort({"season": -1}).toArray(function(e, docs) {
					disp_coach = docs;
					console.log("displaying coach standings...");

					res.render('football_coach', {
						year: year,
						completed_weeks: completed_weeks,
						coach_standings: disp_coach
					})
				}) // end of display pull				
			}, 2000)
		}) // end of python script
	}
} // end of all_football_coach function

// execute scriptf	
	// if year is greater than completed season, SCRAPE
	if (year > completed_football_season) {
		
		db.collection("all_coach_" + year).remove({});
	
		// how many weeks have been completed, able to scrape
		if (football_ahead == true) {
			completed_weeks = football_ahead_completed_matchups;
		}

		// set array of owner numbers
		var number_of_owners = 10;
		var owner_list = [];
		for (var i=1; i<=number_of_owners; i++) {
			owner_list.push(i.toString());
		}

		// run synchronous for loop function
		all_football_coach(0, owner_list);
	} // end of if need to be scraped
	// if year is in past, just pull
	else {
		completed_weeks = 13
		// pull from collection for display
		db.collection("all_coach_" + year).find({}, {"_id": 0}).sort({"season": -1}).toArray(function(e, docs) {
			disp_coach = docs;
			console.log("displaying coach standings...");

			res.render('football_coach', {
				year: year,
				completed_weeks: completed_weeks,
				coach_standings: disp_coach
			})
		}) // end of display pull	
	} // end of just pull

} // end of coach module

module.exports = {
	coach
}