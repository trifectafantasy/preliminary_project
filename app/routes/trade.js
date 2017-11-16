///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function trade_analysis(req, res, db, args) {

	let year = args.year;
	let sport = args.sport;
	let completed_sport_season = args.completed_sport_season;

function display() {
	// set final category to sort by dependent on sport
	if (sport === 'football') {
		category_sort = "PTS";
	}
	else {
		category_sort = "GP";
	}

	db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"], [category_sort, "asc"]]}).toArray(function(e, docs) {
		//console.log(docs);
		console.log('Displaying trade analysis...');
		console.log("");
		disp_trade = docs;
		
		res.render(sport + '_trade', {
			year: year,
			trader: disp_trade,
		})
	}) // end of pull for trade display
} // end of display function

	// if year is greater than the last completed one (aka, in season)
	if (year > completed_sport_season) {

		// send to trade.js for transactional trades scrape
		var trade = require('../modules/trade_analysis_scrape.js')(req, res, db, sport, year, function(err, owner_number_list, trades_processed, players_processed) {
		// return callback variables owner_number_list, trades_processed, and players_processed

			// remove duplicate owner numbers so only scrape each owner who made a trade once
			owner_number_list = owner_number_list.filter(function(item, index, inputArray) {
				return inputArray.indexOf(item) == index;
			})
			//console.log("new owner numbers: ", owner_number_list);

			console.log("trades processed:", trades_processed);
			console.log("players processed:", players_processed);

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
					pyshell.run('python/' + sport + '_trade_analysis.py', options, function(err) {
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

function trade_history_upload(req, res, db, args) {

	// insert trade into trade history db and when finished send 200, OK
	db.collection("trade_history").insert(args, function() {
		console.log("Trade uploaded");

		res.status(200).send({"message": "Trade between " + args.owner1 + " and " + args.owner2 + " successfully addeed!"});
	});

} // end of trade_history_upload module

function trade_history_display(req, res, db) {

	//db.collection(sport + "_trade_history_" + year + "_all").find({}, {"_id":0}, {"sort": [["date", "desc"]]}).toArray(function(e, docs1) {
	db.collection("trade_history").find({}, {"_id":0}, {"sort": [["date", "desc"]]}).toArray(function(e, docs1) {
		//console.log(docs1);
		disp_trade_history = docs1;
		console.log("Displaying trade history...");
		console.log("");

		res.render('trade_history', {
			trade_history: disp_trade_history
		}) // end of res render
	}) // end of display pull

} // end of trade_history_display

module.exports = {
	trade_analysis,
	trade_history_upload,
	trade_history_display
}