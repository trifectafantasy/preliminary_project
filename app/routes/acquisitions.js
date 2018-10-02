///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function acquisitions(req, res, db, args) {

	let sport = args.sport;
	let year = args.year;
	let owner_number = args.owner_number;
	var completed_sport_season = args.completed_sport_season;

// define functions for module
var acquire_process = function() {

	if (owner_number === 'all') {

		// scrape draft once
		var draft = require('../modules/draft.js')(req, res, db, sport, year, function(err, call4) {
			console.log("drafted players done");

			// set array of owner numbers
			var number_of_owners = 10;
			var owner_list = [];
			for (var i=1; i<=number_of_owners; i++) {
				owner_list.push(i.toString());
			}
		
			// call function that synchronously loops through acquistions for each team
			all_acquisitions(0, owner_list);
			
		}) // end of draft scrape
	}

	// if owner is a specific owner
	else {
		// send to script that adds drafted players
		var draft = require('../modules/draft.js')(req, res, db, sport, year, function(err, call2) {
			console.log("drafted players done");			
		
			var active_stats = require('../modules/' + sport + '_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
				console.log("active stats scrape done");

				var add = require('../modules/' + sport + '_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
					console.log("added players done");

					var aux = require('../modules/' + sport + '_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
						console.log("aux stats added");

						var options = {
							args: [sport, year, owner_number]
						}

						// python script that determines acqusition value
						pyshell.run('python/' + sport + '_acquisitions.py', options, function(err) {
							console.log("acquisition python script complete");
							var acquisitions_display = require('../modules/acquisitions_display.js')(req, res, db, sport, year, owner_number)			
						}) // end of python script

					}) // end of aux
				}) // end of football draft script
			}) // end of football add script
		})	// end of footbabll draft
	} // end of else for specific owner
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

					pyshell.run('python/' + sport + '_acquisitions.py', options, function(err) {
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
		var acquisitions_display = require('../modules/acquisitions_display.js')(req, res, db, sport, year, owner_number)			
	}
} // end of all_football_acquisitions function

// execute script //
	if (year > completed_sport_season) {

		console.log("Don't scrape for acquisitions anymore.");
		res.send("Sorry, but acquisition stats aren't updated anymore.");

		/*
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
		*/
	}
	else {
		var acquisitions_display = require('../modules/acquisitions_display.js')(req, res, db, sport, year, owner_number);
	}
} // end of acquisitions module

module.exports = {
	acquisitions
}