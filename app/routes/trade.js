///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function trade(req, res, db, args) {

	function display() {

		// set final category to sort by dependent on sport
		if (sport === 'football') {
			category_sort = "PTS";
		}
		else {
			category_sort = "GP";
		}

		db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"], [category_sort, "asc"]]}).toArray(function(e, docs) {
			console.log('displaying trade analysis...');
			//console.log(docs);
			disp_trade = docs;
			res.render(sport + '_trade', {
				year: year,
				trader: disp_trade,
			})
		}) // end of pull for trade display
	} // end of display function

	let year = args.year;
	let sport = args.sport;
	let completed_sport_season = args.completed_sport_season;

	// if year is greater than the last completed one (aka, in season)
	if (year > completed_sport_season) {

		// send to trade.js for transactional trades scrape
		var trade = require('../modules/trade_analysis.js')(req, res, db, sport, year, function(err, owner_number_list, trades_processed, players_processed) {
		// return callback variables owner_number_list, trades_processed, and players_processed

			// remove duplicate owner numbers so only scrape each owner who made a trade once
			owner_number_list = owner_number_list.filter(function(item, index, inputArray) {
				return inputArray.indexOf(item) == index;
			})
			//console.log("new owner numbers: ", owner_number_list);

			console.log("trades processed: ", trades_processed);
			console.log("players processed: ", players_processed);

			if (trades_processed == 0) {
				res.send("Oh no! No trades have been made!")
			}
			else {
				// send to football_trade_stats to scrape active stats for players in trades
				var trade_stats = require('../modules/' + sport + '_trade_stats.js')(req, res, db, sport, year, owner_number_list, function(err, call) {
					console.log("scrape done");

					var options = {
						args: [sport, year]
					};

					// run python script to associate traded players with their active stats and sum to make total 
					pyshell.run(sport + '_trade_analysis.py', options, function(err) {
						if (err) throw err;
						console.log('trade python script complete');

						display();
					}) // end of pyshell
				}); // end of trade stats
			} // end of if no trades were made
		}) // end of trade script
	} // end of need to scrape

	// if sport want trade analysis for was in the past, skip scrape
	else {
		// handle specific cases, if else, send to display()
		if (sport === 'football' && year === '2015') {
			res.send("Sorry, but trade analysis unavailable for Football 2015")
		}
		else if (sport === 'basketball' && year === '2016') {
			res.send("Welp. No trades were made in Basketball 2016")
		}
		else {
			display();
		}
	} // end of no scrape, just display
} // end of trade module

module.exports = {
	trade
}