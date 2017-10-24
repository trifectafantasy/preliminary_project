///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

// create callback function
module.exports = function(req, res, db, sport, year, owner_number, callback) {

	// blanketly set each acquired method as traded (to be later overwritten by drafted or added) 
	db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).updateMany({}, {"$set": {"acquired": "Trade", "draft_position": "N/A"}}, function(err, result) {

		// use today as end date for query for transactions 
		var d = new Date();
		var end_year = d.getFullYear();
		var end_month = d.getMonth() + 1;
		var end_day = d.getDate();

		var start_year = String(parseInt(year) - 1);

		// to account for day needing to be 2 digits
		if (end_day < 10) {
			end_day = "0" + String(end_day)
		}		

		// to account for month needing to be 2 digits
		if (end_month < 10) {
			end_month = "0" + String(end_month)
		}

		// url for scrape
		var url = 'http://games.espn.com/fba/recentactivity?leagueId=100660&seasonId=' + year + '&activityType=2&startDate=' + start_year + '1001&endDate=' + end_year + end_month + end_day + '&teamId=' + owner_number + '&tranType=2';

		// request for scrape
		request(url, function(error, response, html) {

			// if not an error
			if(!error){

				// use cheerio to traverse and scrape html 
				var $ = cheerio.load(html);

				scrape = $('tr.tableSubHead');
				//console.log(scrape.text());
				rows = scrape.siblings();
				//console.log(hello_children.text());

				// iterate through every transaction row
				rows.each(function(j, element) {

					date = $(this).children().first();
					//console.log(date.text());

					type = date.next();
					//console.log(type.text());

					type_slice = type.text().slice(13);
					//console.log(type_slice);

					if (type_slice.includes("Add")) {

						players = type.next();
						//console.log(players.text());
						full_player_string = players.text();
						//console.log(full_player_string);

						player = full_player_string.slice(full_player_string.indexOf("added ") + 6, full_player_string.indexOf(","));
						//console.log(player);

						// update acquired per player
						db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).update({"player": player}, {"$set": {"acquired": "FA", "draft_position": "N/A"}})

					} // end of if add

				}) // end of rows iteration

			} // end of if(!error)
		
		callback();
		}) // end of request
	}) // end of update all to trade

}

