///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');


function owner_matchups(req, res, db, args, football_args, basketball_args, baseball_args) {

	let owner_number = args.owner_number;
	let year1 = args.year1;
	let year2 = args.year2;
	let current_year1 = args.current_year1;
	let current_year2 = args.current_year2;

	let year_diff = year2 - year1;

	let this_football_season_started = football_args.this_football_season_started;
	let football_completed_matchups = football_args.football_completed_matchups;
	let this_football_completed_season = football_args.this_football_completed_season;
	let football_ahead = football_args.football_ahead;
	let football_ahead_completed_matchups = football_args.football_ahead_completed_matchups;

	let this_basketball_season_started = basketball_args.this_basketball_season_started;
	let basketball_completed_matchups = basketball_args.basketball_completed_matchups;
	let this_basketball_completed_season = basketball_args.this_basketball_completed_season;

	let this_baseball_season_started = baseball_args.this_baseball_season_started;
	let baseball_completed_matchups = baseball_args.baseball_completed_matchups;
	let this_baseball_completed_season = baseball_args.this_baseball_completed_season;


	// handle error case of non consecutive years
	if (year_diff != 1) {
		res.send("Please enter two consecutive years")
	}

	// if pass first error handle
	else {
		// if the given years are the current ones, set appropriate parameters
		if (year1 == current_year1 && year2 == current_year2) {

			// if no matchups have been completed yet, it's like the sport isn't in season yet
			if (football_completed_matchups == 0) {
				this_football_season_started = false;
			}

			if (basketball_completed_matchups == 0) {
				this_basketball_season_started = false;
			}

			if (baseball_completed_matchups == 0) {
				this_baseball_season_started = false;
			}
			
			// call matchups.js with all the necessary arguments
			var match = require('../modules/owner_matchups.js')(req, res, db, owner_number, year1, year2, this_football_season_started, football_completed_matchups, this_football_completed_season, this_basketball_season_started, basketball_completed_matchups, this_basketball_completed_season, this_baseball_season_started, baseball_completed_matchups, this_baseball_completed_season);
		}
		// if the years given are in the past, set everything as finished (true, max, true)
		else if (year1 < current_year1 && year2 < current_year2) {
			
			// football variables
			this_football_season_started = true;
			this_football_completed_season = true;
			// full regular season = 13 matchups
			football_completed_matchups = 13;

			// basketball variables
			this_basketball_season_started = true;
			this_basketball_completed_season = true;
			// full regular season = 18 matchups
			basketball_completed_matchups = 18;	

			// baseball variables
			this_baseball_season_started = true;
			this_baseball_completed_season = true;
			// full regular season = 22 matchups
			baseball_completed_matchups = 22;

			// call matchups.js with all the necessary arguments
			var match = require('../modules/owner_matchups.js')(req, res, db, owner_number, year1, year2, this_football_season_started, football_completed_matchups, this_football_completed_season, this_basketball_season_started, basketball_completed_matchups, this_basketball_completed_season, this_baseball_season_started, baseball_completed_matchups, this_baseball_completed_season);
		}
		// handle error case if years are greater than current
		else {
			if (football_ahead == false) {
				var disp_err = "Please enter years " + current_year1 + " & " + current_year2 + " or less";
				res.send(disp_err);				
			}
			// setting for future football season
			else {

				// football variables
				this_football_season_started = true;
				this_football_completed_season = false;
				// full regular season = 13 matchups
				football_completed_matchups = football_ahead_completed_matchups;

				// basketball variables
				this_basketball_season_started = false;
				this_basketball_completed_season = false;
				// full regular season = 18 matchups
				basketball_completed_matchups = 0;	

				// baseball variables
				this_baseball_season_started = false;
				this_baseball_completed_season = false;
				// full regular season = 22 matchups
				baseball_completed_matchups = 0;

				// call matchups.js with all the necessary arguments
				var match = require('../modules/owner_matchups.js')(req, res, db, owner_number, year1, year2, this_football_season_started, football_completed_matchups, this_football_completed_season, this_basketball_season_started, basketball_completed_matchups, this_basketball_completed_season, this_baseball_season_started, baseball_completed_matchups, this_baseball_completed_season);				
			} // end of else for future football
		} // end of else for error case and future football season
	}	
} // end of owner_matchups module

function all_owner_matchups(req, res, db, args, football_args, basketball_args, baseball_args) {

	var disp_football_matchups = null;
	var disp_basketball_matchups = null;
	var disp_baseball_matchups = null;
	var disp_trifecta_matchups = null;

var complete = function() {
	if ((disp_football_matchups !== null && disp_basketball_matchups !== null) && (disp_baseball_matchups !== null && disp_trifecta_matchups !== null)) {

		res.render('total_owner_matchups', {
			owner: owner_name,
			football_matchups: disp_football_matchups,
			basketball_matchups: disp_basketball_matchups,
			baseball_matchups: disp_baseball_matchups,
			trifecta_matchups: disp_trifecta_matchups
		})
	}
} // end of complete function

	let owner_number = args.owner_number;

	let completed_football_season = football_args.completed_football_season;
	let this_football_season_started = football_args.this_football_season_started;
	let this_football_completed_season = football_args.this_football_completed_season;
	let football_completed_matchups = football_args.football_completed_matchups;
	let football_ahead = football_args.football_ahead;
	let football_ahead_completed_matchups = football_args.football_ahead_completed_matchups;

	let completed_basketball_season = basketball_args.completed_basketball_season;
	let this_basketball_season_started = basketball_args.this_basketball_season_started;
	let basketball_completed_matchups = basketball_args.basketball_completed_matchups;
	let this_basketball_completed_season = basketball_args.this_basketball_completed_season;

	let completed_baseball_season = baseball_args.completed_baseball_season;
	let this_baseball_season_started = baseball_args.this_baseball_season_started;
	let baseball_completed_matchups = baseball_args.baseball_completed_matchups;
	let this_baseball_completed_season = baseball_args.this_baseball_completed_season;

	// determine in_season variable from season_started and completed_season variables
	if (this_football_season_started == true && this_football_completed_season == false) {
		var football_in_season = true;
		if (football_completed_matchups == 0) {
			var football_in_season = false;
		}
	}
	else {
		var football_in_season = false;
	}

	// determine in_season variable from season_started and completed_season variables
	if (this_basketball_season_started == true && this_basketball_completed_season == false) {
		var basketball_in_season = true;
		if (basketball_completed_matchups == 0) {
			var basketball_in_season = false;
		}		
	}
	else {
		var basketball_in_season = false;
	}

	// determine in_season variable from season_started and completed_season variables
	if (this_baseball_season_started == true && this_baseball_completed_season == false) {
		var baseball_in_season = true;
		if (baseball_completed_matchups == 0) {
			var baseball_in_season = false;
		}		
	}
	else {
		var baseball_in_season = false;
	}

	// handle football_ahead variable for in season
	if (football_ahead == true) {
		football_in_season = true;
		if (football_ahead_completed_matchups == 0) {
			football_in_season = false;
		}
	}	

	var options = {
		args: [owner_number, completed_football_season, football_in_season, completed_basketball_season, basketball_in_season, completed_baseball_season, baseball_in_season]
	}

	db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"]
		//console.log(owner_name);

		pyshell.run('total_owner_matchups.py', options, function(err) {
			if (err) throw err;
			console.log("total matchups python script complete");


			db.collection('owner' + owner_number + '_football_matchups_all').find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling football data...');
				disp_football_matchups = docs;
				complete();
			})

			db.collection('owner' + owner_number + '_basketball_matchups_all').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling basketball data...');
				disp_basketball_matchups = docs;
				complete();

			})

			db.collection('owner' + owner_number + '_baseball_matchups_all').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling baseball data...');
				disp_baseball_matchups = docs;
				complete();
			})

			db.collection('owner' + owner_number + '_trifecta_matchups_all').find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling trifecta data...');
				disp_trifecta_matchups = docs;
				complete();
			})		

		}) // end of total owner python script
	});

}

module.exports = {
	owner_matchups,
	all_owner_matchups
};