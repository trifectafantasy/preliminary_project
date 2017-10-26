///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function popular(req, res, db, args) {

	let year = args.year;
	let sport = args.sport;
	let completed_sport_season = args.completed_sport_season;
	let score_cat = args.score_cat;

// function that scrapes and calculates most popular players per owner per sport
var all_popular = function(x, owner_list) {

	if (x < owner_list.length) {
		owner_number = owner_list[x];
		console.log("owner number", owner_number);

		var popular = require('../modules/popular_scrape.js')(req, res, db, sport, year, owner_number, function(err, call) {
			console.log("popular scrape done");

			var options = {
				args: [sport, year, owner_number]
			}

			// python script that calculates players with most transactions per team
			pyshell.run('popular_individual.py', options, function(err) {
				console.log("popular python script done");

				// send back through loop
				all_popular(x + 1, owner_list)
			}) // end of pyshell
		}) // end of popular.js scrape
	} // end of if still in loop
	
	// if finished with loop
	else {
		var options = {
			args: [sport, year]
		}

		// python script that calculates player that was on most teams and owners who had player on roster
		pyshell.run('popular_all.py', options, function(err) {
			console.log("all popular python script done");

			// delay 2 seconds to let database populate
			setTimeout(function() {

				// pull all owner names NOT "all", ie all individual owners
				db.collection(sport + "_popular_" + year).find({"owner": {"$not": /all/}}, {"_id": 0}, {"sort": [["transactions", "desc"], ["owner", "desc"], [score_cat, "desc"]]}).toArray(function(e, docs) {
					disp_individual = docs;

					// pull owner that is all (has player on most teams data)
					db.collection(sport + "_popular_" + year).find({"owner": "all"}, {"_id": 0}).toArray(function(e, docs2) {
						disp_all = docs2;

						console.log("displaying most popular players...")
						res.render('popular', {
							sport: sport,
							year: year,
							popular_individual: disp_individual,
							popular_all: disp_all
						}) // end of render
					}) // end of all popular pull
				}) // end of individual popular pull
			}, 2000)
		}) // end of pyshell
	} // end of else
} // end of function

// start of executed script //
	// set array of owner numbers
	var number_of_owners = 10;
	var owner_list = [];
	for (var i=1; i<=number_of_owners; i++) {
		owner_list.push(i.toString());
	}
	
	// if season not completed, scrape
	if (year > completed_sport_season) {

		db.collection(sport + "_popular_" + year).remove({});

		all_popular(0, owner_list);
	}
	// else just pull and display
	else {
		db.collection(sport + "_popular_" + year).find({"owner": {"$not": /all/}}, {"_id": 0}, {"sort": [["transactions", "desc"], ["owner", "desc"], [score_cat, "desc"]]}).toArray(function(e, docs) {
			disp_individual = docs;

			db.collection(sport + "_popular_" + year).find({"owner": "all"}, {"_id": 0}).toArray(function(e, docs2) {
				disp_all = docs2;

				console.log("displaying most popular players...")
				res.render('popular', {
					sport: sport,
					year: year,
					popular_individual: disp_individual,
					popular_all: disp_all
				}) // end od render
			}) // end of all pull
		}) // end of individual pull
	} // end of else	

} // end of popular module

module.exports = {
	popular
}