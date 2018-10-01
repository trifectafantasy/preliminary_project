///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');


function trifecta_standings(req, res, db, args) {

	let year1 = args.year1;
	let year2 = args.year2;
	let current_year1 = args.current_year1;
	let current_year2 = args.current_year2;
	let this_football_season_started = args.football_season_started;
	let this_basketball_season_started = args.basketball_season_started;
	let this_baseball_season_started = args.baseball_season_started;

	let year_diff = year2 - year1;

	// initialize display variable
	var disp_trifecta_standings = null;

// function that runs trifecta standings python script
function python_trifecta_standings() {
	var options = {
		args: [year1, year2, this_football_season_started, this_basketball_season_started, this_baseball_season_started]
	}

	// always run trifecta standings python script
	pyshell.run('python/trifecta_standings.py', options, function(err) {
		if (err) throw err;
		console.log("trifecta standings python script complete");

		display_trifecta_standings();
	});	

} // end of python_trifecta_standings function

// function that displays trifecta standings
function display_trifecta_standings() {
	// pull from this seasons trifecta collection
	db.collection('trifecta_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs){
		//console.log(docs);
		console.log("Displaying trifecta season standings...");
		console.log("");
		disp_trifecta_standings = docs;

		// render to standings_playoffs
		res.render('trifecta_season', {
			year1: year1,
			year2: year2,
			trifecta_standings: disp_trifecta_standings,
		});
	});
} // end of display_trifecta_standings function


	// handle error case of non consecutive years
	if (year_diff != 1) {
		res.send("Please enter two consecutive years")
	}

	// if pass first error handle
	else {
		// if the given years are the current ones, set appropriate parameters
		if (year1 == current_year1 && year2 == current_year2) {

			// For each sport that is in season, call sports standings page to update standing before trifecta standings update

			// if baseball season started, update all sports standings
			if (this_baseball_season_started == true) {
				request("http://localhost:8081/baseball_standings/" + year2, function(err, baseball_response, baseball_body) {
					console.log("baseball standings updated");
					console.log("");

					request("http://localhost:8081/basketball_standings/" + year2, function(err, basketball_response, basketball_body) {
						console.log("basketball standings updated");
						console.log("");

						request("http://localhost:8081/football_standings/" + year1, function(err, football_response, football_body) {
							console.log("football standings updated");
							console.log("");

							python_trifecta_standings();
						})
					})
				})
			}

			// if basketball season started, update basketball and football standings before trifecta standings update
			else if (this_basketball_season_started == true) {
				request("http://localhost:8081/basketball_standings/" + year2, function(err, basketball_response, basketball_body) {
					console.log("basketball standings updated");
					console.log("");

					request("http://localhost:8081/football_standings/" + year1, function(err, football_response, football_body) {
						console.log("football standings updated");
						console.log("");

						python_trifecta_standings();						
					})
				})
			}

			// if football season started, update foodtball standings before trifecta standings update
			else if (this_football_season_started == true) {
				request("http://localhost:8081/football_standings/" + year1, function(err, football_response, football_body) {
					console.log("football standings updated");
					console.log("");
					
					python_trifecta_standings();
				})
			}
		}

		// if the years given are in the past, don't just need to pull trifecta standings
		else if (year1 < current_year1 && year2 < current_year2) {

			display_trifecta_standings();
		}

		else {
			// handle error case if years are greater than current
			if (football_ahead == false) {
				var disp_err = "Please enter years " + current_year1 + " & " + current_year2 + " or less";
				res.send(disp_err);
			}
			// handle case when football starts in next trifecta season during baseball in previous trifecta season
			else {
				this_football_season_started = true;
				this_basketball_season_started = false;
				this_baseball_season_started = false;

				var options = {
					args: [year1, year2, this_football_season_started, this_basketball_season_started, this_baseball_season_started]
				}

				// always run trifecta standings python script
				pyshell.run('python/trifecta_standings.py', options, function(err) {
					if (err) throw err;
					console.log("Trifecta standings python script complete");
					
					display_trifecta_standings();
				});
			}
		}
	} // end of first error handling
} // end of trifeta_standings module

function football_standings(req, res, db, args) {

	var disp_h2h_standings = null;
	var disp_trifecta_standings = null;

	let year = args.year;
	let completed_football_season = args.completed_football_season;
	let this_football_season_started = args.this_football_season_started;
	let playoffs = args.playoffs;

// function that checks if both finds from mongodb are complete then renders views
var complete = function() {

	if (playoffs === true) {
		if (disp_h2h_standings !== null && disp_trifecta_standings !== null) {
			// render to standings_playoffs
			res.render('football_standings', {
				h2h_standings: disp_h2h_standings,
				trifecta_standings: disp_trifecta_standings,
				year: year,
				playoffs: playoffs
			});
		}
	}
	else {
		if (disp_h2h_standings !== null) {
			// render to standings
			res.render('football_standings', {
				h2h_standings: disp_h2h_standings,
				year: year,
				playoffs: playoffs
			});
		}
	}
} // end of complete

	// if requested season is already completed, just pull from database
	if (year <= completed_football_season) {
		playoffs = true

		// pull from mongodb and display new data after python script finishes
		db.collection('football_h2h_' + year).find({}, {"_id": 0}).sort({"trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying h2h data...");
			console.log("");
			disp_h2h_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		var options = {
			args: [year]
		};

		db.collection('football_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying playoff data...");
			console.log("");
			disp_trifecta_standings = docs;
			complete();
		});
	} // end of if <= 2016 (aka, don't need to srape anymore)

	// if this current and in season, scrape
	else if (this_football_season_started === true && year - completed_football_season == 1) {
		var stand = require('../modules/football_standings_router_template.js')(req, res, db, year, playoffs);
	}
	else {
		res.send("Football " + year + " is not in season yet")
	}
} // end of football_standings module


function basketball_standings(req, res, db, args) {

	var disp_h2h_standings = null;
	var disp_roto_standings = null;
	var disp_trifecta_standings = null;

	var year = args.year;
	let completed_basketball_season = args.completed_basketball_season;
	let this_basketball_season_started = args.this_basketball_season_started;
	let in_season = args.this_basketball_in_season;
	var playoffs = args.playoffs;

// function that checks if both finds from mongodb are complete (ie display variables are not empty)
var complete = function() {

	if (playoffs === true) {
		if ((disp_h2h_standings !== null && disp_roto_standings !== null) && disp_trifecta_standings !== null) {

			// render to basketball_standings
			res.render('basketball_standings', {
				h2h_standings: disp_h2h_standings,
				roto_standings: disp_roto_standings,
				trifecta_standings: disp_trifecta_standings,
				year: year,
				playoffs: playoffs
			});
		}
	}
	else {
		if (disp_h2h_standings !== null && disp_roto_standings !== null) {

			// render to basketball_standings
			res.render('basketball_standings', {
				h2h_standings: disp_h2h_standings,
				roto_standings: disp_roto_standings,
				year: year,
				playoffs: playoffs
			});
		}
	}
} // end of complete function

	// if season is in the past, just display
	if (year <= completed_basketball_season) {
		playoffs = true;

		// pull from mongodb and display new data after python script finishes
		db.collection('basketball_h2h_' + year).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying h2h data...");
			console.log("");
			disp_h2h_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		db.collection('basketball_roto_' + year).find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying roto data...");
			console.log("");
			disp_roto_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		var options = {
			args: [year]
		};

		db.collection('basketball_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying playoff data...");
			console.log("");
			disp_trifecta_standings = docs;
			complete();
		});
	}
	else if (this_basketball_season_started === true && year - completed_basketball_season == 1) {
		var stand = require('../modules/basketball_standings_router_template.js')(req, res, db, year, in_season, playoffs);
	}
	else {
		res.send("Basketball " + year + " is not in season yet")
	}
} // end of basketball_standings module

function baseball_standings(req, res, db, args) {

	var disp_h2h_standings = null;
	var disp_roto_standings = null;
	var disp_trifecta_standings = null;

	var year = args.year;
	var completed_baseball_season = args.completed_baseball_season;
	let this_baseball_season_started = args.this_baseball_season_started;
	let in_season = args.this_baseball_in_season;
	var playoffs = args.playoffs;

// function that checks if both finds from mongodb are complete (ie display variables are not empty)
var complete = function() {

	if (playoffs === true) {
		if ((disp_h2h_standings !== null && disp_roto_standings !== null) && disp_trifecta_standings !== null) {

			// render to baseball_standings
			res.render('baseball_standings', {
				h2h_standings: disp_h2h_standings,
				roto_standings: disp_roto_standings,
				trifecta_standings: disp_trifecta_standings,
				year: year,
				playoffs: playoffs
			});
		}
	}
	else {
		if (disp_h2h_standings !== null && disp_roto_standings !== null) {

			// render to baseball_standings
			res.render('baseball_standings', {
				h2h_standings: disp_h2h_standings,
				roto_standings: disp_roto_standings,
				year: year,
				playoffs: playoffs
			});
		}
	}
} // end of complete function

	// if this season is in the past, just display
	if (year <= completed_baseball_season) {
		playoffs = true;

		// pull from mongodb and display new data after python script finishes
		db.collection('baseball_h2h_' + year).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying h2h data...");
			console.log("");
			disp_h2h_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		db.collection('baseball_roto_' + year).find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying roto data...");
			console.log("");
			disp_roto_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		var options = {
			args: [year]
		};

		db.collection('baseball_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying playoff data...");
			console.log("");
			disp_trifecta_standings = docs;
			complete();
		});
	}
	else if (this_baseball_season_started === true && year - completed_baseball_season == 1) {
		var stand = require('../modules/baseball_standings_router_template.js')(req, res, db, year, in_season, playoffs);
	}
	else {
		res.send("Baseball " + year + " is not in season yet.");
	}
} // end of baseball_standings module

module.exports = {
	trifecta_standings,
	football_standings,
	basketball_standings,
	baseball_standings
};
