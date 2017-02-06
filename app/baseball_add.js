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

	// blanketly update all with Trade (to be overwritten by Draft or Add in the future)
	db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).updateMany({}, {"$set": {"acquired": "Trade", "draft_position": "N/A"}}, function(err, result) {

		// use today as end date for query for transactions 
		var d = new Date();
		var end_year = d.getFullYear();
		var end_month = d.getMonth() + 1;
		var end_day = d.getDate();

		// url for scrape
		var url = 'http://games.espn.com/flb/recentactivity?leagueId=109364&seasonId=' + year + '&activityType=2&startDate=' + year + '0301&endDate=' + end_year + end_month + end_day + '&teamId=' + owner_number + '&tranType=2';

		// request for scrape
		request(url, function(error, response, html) {

			// if not an error
			if(!error){

				// use cheerio to traverse and scrape html 
				var $ = cheerio.load(html);

				scrape = $('tr.tableSubHead');
				//console.log(scrape);
				rows = scrape.siblings();
				//console.log(rows.text());

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

						// slice only player's name
						player = full_player_string.slice(full_player_string.indexOf("added ") + 6, full_player_string.indexOf(","));
						//console.log(player);

						db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).update({"player": player}, {"$set": {"acquired": "FA", "draft_position": "N/A"}})

					} // end of if add

				}) // end of rows iteration

			} // end of if(!error)
		
		callback();
		}) // end of request

	})


}

