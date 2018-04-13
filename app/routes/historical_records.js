///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function historical_records(req, res, db, sport) {
	
	options = {
		args: [sport]
	}

	pyshell.run('python/historical_records.py', options, function(err) {
		console.log("historical records python script complete");

		if (sport == "football") {
			db.collection("owner_historical_records").find({"sport": sport}, {"sport": 0, "_id": 0}).sort({"football_win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);

				console.log("Displaying historical record...");
				console.log("");
				res.render('historical_records', {
					sport: sport,
					historical_records: docs
				})
			})
		}

		else if (sport == "basketball") {
			db.collection("owner_historical_records").find({"sport": sport}, {"sport": 0, "_id": 0}).sort({"basketball_win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);

				console.log("Displaying historical record...");
				console.log("");
				res.render('historical_records', {
					sport: sport,
					historical_records: docs
				})
			})			
		}

		else if (sport == "baseball") {
			db.collection("owner_historical_records").find({"sport": sport}, {"sport": 0, "_id": 0}).sort({"baseball_win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);

				console.log("Displaying historical record...");
				console.log("");
				res.render('historical_records', {
					sport: sport,
					historical_records: docs
				})
			})
		}

		else if (sport == "combined") {
			db.collection("owner_historical_records").find({"sport": sport}, {"sport": 0, "_id": 0}).sort({"combined_win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);

				console.log("Displaying historical record...");
				console.log("");
				res.render('historical_records', {
					sport: sport,
					historical_records: docs
				})
			})			
		}
	}) // end of pyshell
}


module.exports = {
	historical_records
};