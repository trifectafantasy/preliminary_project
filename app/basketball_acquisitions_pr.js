///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');
var forEach = require('async-foreach').forEach;

var mongo = require('mongodb');
var assert = require('assert');

// create callback function
module.exports = function(req, res, db, sport, year, callback) {

	// list of start indexes to cycle through top 400 players
	var start_index_list = ["0", "50", "100", "150", "200", "250", "300", "350", "400"];

	var complete_count = 0;

	// remove collection to
	db.collection(sport + "_pr_" + year).remove({}, function(err, results) {
		
		// for each start index
		start_index_list.forEach(function(start_index, index) {

			var url = 'http://games.espn.com/fba/playerrater?leagueId=100660&seasonId=' + year + '&startIndex=' + start_index;

				// request for scrape
				request(url, function(error, response, html) {

					// if not an error
					if(!error){

						// use cheerio to traverse and scrape html 
						var $ = cheerio.load(html);

						scrape = $('tr.playerTableBgRowSubhead.tableSubHead');
						//console.log(scrape.text());

						rows = scrape.siblings();
						//console.log(rows.text());

						// for each row 
						rows.each(function(j, element) {

							// store scraped data for each team as json
							var json = {
								player: "",
								PR: ""
							}				

							player_row = $(this).children();
							//console.log(player_row.text());
							player = player_row.first().next();
							PR = player_row.last();

			 				// store each scraped value in json as TEXT, INT, or FLOAT
			 				player_name = player.text();
			 				player_name = player_name.slice(0, player_name.indexOf(","));
			 				//console.log(player_name);

			 				json.player = player_name;
			 				json.PR = parseFloat(PR.text());
			 				
			 				//console.log(json);

			 				// if reaches end of page, count, but don't add to collection
							if (json.player == "") {
								complete();
							}
							// if a real player, add to collection		
							else {
			 					db.collection(sport + "_pr_" + year).insert(json);
							}
						}) // end of rows scrape iteration
					} // end of if(!error)
				}) // end of request

			// complete function which when all start index scrapes are done
			var complete = function() {
				complete_count += 1;

				if (complete_count == start_index_list.length){
					callback();
				}	
			}

		}) // end of for each		
	}) // end of remove

}

