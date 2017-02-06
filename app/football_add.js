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

	// blanket update all players with trade (to be later overwritten by drafted or added)
	db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).updateMany({}, {"$set": {"acquired": "Trade", "draft_position": "N/A"}});
		
	// pull football owner number per owner number
	db.collection('football_owners').find({"owner_number": parseInt(owner_number)}, {"football_owner_number": 1, "_id": 0}).toArray(function(e, docs) {

		//console.log(docs);
		football_owner_number = docs[0]["football_owner_number"]

		// use today as end date for query for transactions 
		var d = new Date();
		var end_year = d.getFullYear();
		var end_month = d.getMonth() + 1;
		var end_day = d.getDate();

		// url for scrape
		var url = 'http://games.espn.com/ffl/recentactivity?leagueId=154802&seasonId=' + year + '&activityType=2&startDate=' + year + '0801&endDate=' + end_year + end_month + end_day + '&teamId=' + football_owner_number + '&tranType=2';
		
		// request for scrape
		request(url, function(error, response, html) {

			// if not an error
			if(!error){

				// use cheerio to traverse and scrape html 
				var $ = cheerio.load(html);

				// iterate through every game in the week

				scrape = $('tr.tableSubHead');
				//console.log(scrape);
				rows = scrape.siblings();
				//console.log(hello_children.text());

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

						player = full_player_string.slice(full_player_string.indexOf("added ") + 6, full_player_string.indexOf(","));
						//console.log("player added: ", player);

						// update with free agent status
						db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).update({"player": player}, {"$set": {"acquired": "FA", "draft_position": "N/A"}})
					} // end of if add
				}) // end of row scrape iteration
			} // end of if(!error)
			
			callback();
		}) // end of request
	})	// end of football owners pull 

}

