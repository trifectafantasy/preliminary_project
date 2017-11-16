///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function origin(req, res, db, args) {
	
	let sport = args.sport;
	let year = args.year;
	let completed_sport_season = args.completed_sport_season;

// define functions to use inside module //
var origin_process = function() {

	var draft = require('../modules/draft.js')(req, res, db, sport, year, function(err, call){
		console.log("drafted players done");

		// set array of owner numbers
		var number_of_owners = 10;
		var owner_list = [];
		for (var i=1; i<=number_of_owners; i++) {
			owner_list.push(i.toString());
		}		

		// call function that synchronously loops through acquistions for each team
		all_origin(0, owner_list);				
	})

} // end of origin_process function

// function that synchronously updates acquisitions for each team
var all_origin = function(x, owner_list) {

	if (x < owner_list.length) {

		owner_number = owner_list[x];
		console.log("owner number", owner_number);

		var active_stats = require('../modules/' + sport + '_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
			console.log("active stats scrape done");

			var football_add = require('../modules/' + sport + '_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
				console.log("added players done");

				var football_aux = require('../modules/' + sport + '_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
					console.log("aux stats added");

					var options = {
						args: [sport, year, owner_number]
					}

					pyshell.run('python/' + sport + '_origin.py', options, function(err) {
						console.log("origin python script complete");

						all_origin(x + 1, owner_list);
					
					}) // end of pyshell 
				}) // end of football auxiliary
			}) // end of football add 
		}) // end of active stats
	}
	// if done with all the owners in owners_list
	else {
		// display after all the loops have been finished, but delay 2 seconds to let database update fully
		setTimeout(function() {
			
			display();
		}, 2000)
	}

} // end of all_origin function			

var display = function() {

	if (sport == "football") {
				// reset owner number (after it has gone through loop) to all for all display
		db.collection(sport + "_origin_" + year).find({}, {"_id": 0}).sort({"total_points": -1}).toArray(function(e, docs) {
			origin_standings = docs;
			console.log("Displaying origin standings...");
			console.log("");

			res.render('origin', {
				sport: sport,
				year: year,
				origin: origin_standings
			})
		})			
	}

	else {
		// reset owner number (after it has gone through loop) to all for all display
		db.collection(sport + "_origin_" + year).find({}, {"_id": 0}).sort({"total_pr": -1}).toArray(function(e, docs) {
			origin_standings = docs;
			console.log("displaying origin standings...");
			console.log("");

			res.render('origin', {
				sport: sport,
				year: year,
				origin: origin_standings
			})
		})	
	}	
} // end of if just display

// start of script //

	// if present season, scrape and go through process
	if (year > completed_sport_season) {

		db.collection(sport  + '_origin_' + year).remove({});

		if (sport === 'football') {
			origin_process();
		}
		else {
			// scrape PR once for basketball and baseball
			var pr_scrape = require('../modules/' + sport + '_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
				console.log("PR scrape done");

				origin_process();
			})	
		}
	}
	// if season in past, just display
	else {
		display();
	}

} // end of origin module

module.exports = {
	origin
}