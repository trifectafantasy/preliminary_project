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
module.exports = function(req, res, db, sport, year, owner_number, callback) {

	var complete_count = 0

	// filter list for offense, kickers, and defense
	var filter_list = ["0", "3", "5"];

	// pull football owners collection to find football owner number associated with regular owner number
	db.collection('football_owners').find({"owner_number": parseInt(owner_number)}, {"football_owner_number": 1, "_id": 0}).toArray(function(e, docs) {

		//console.log(docs);
		football_owner_number = docs[0]["football_owner_number"]

		// clear acquisitions collection for fresh start
		db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).remove({}, function(err, result) {

			// loop through each filter number
			filter_list.forEach(function(filter_number, index) {
				//console.log("filter", filter_number)
			
				var url = 'http://games.espn.com/ffl/activestats?leagueId=154802&seasonId=' + year + '&teamId=' + football_owner_number + '&filter=' + filter_number

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

						rows.each(function(j, element) {

							// if filter number is 0, offensive players
							if (filter_number == "0") {
							// store scraped data for each team as json
								var json = {
									player: "",
									PASS: "",
									PASS_YDS: "",
									PASS_TD: "",
									PASS_INT: "",
									RUSH: "",
									RUSH_YDS: "",
									RUSH_TD: "",
									REC: "",
									REC_YDS: "",
									REC_TD: "",
									REC_TAR: "",
									MISC_FUML: "",
									MISC_TD: "",
									PTS: ""
								}				

								player_row = $(this).children();
								//console.log(player_row.text());
								player = player_row.first();
								PASS = player.next().next();
								PASS_YDS = PASS.next();
								PASS_TD = PASS_YDS.next();
								PASS_INT = PASS_TD.next();
								RUSH = PASS_INT.next().next();
								RUSH_YDS = RUSH.next();
								RUSH_TD = RUSH_YDS.next();
								REC = RUSH_TD.next().next();
								REC_YDS = REC.next();
								REC_TD = REC_YDS.next();
								REC_TAR = REC_TD.next();
								MISC_FUML = REC_TAR.next().next();
								MISC_TD = MISC_FUML.next();
								PTS = MISC_TD.next().next();

				 				// store each scraped value in json as TEXT, INT, or FLOAT
				 				player_name = player.text();
				 				player_name = player_name.slice(0, player_name.indexOf(","));

				 				json.player = player_name;
				 				json.PASS = PASS.text();
				 				json.PASS_YDS = parseInt(PASS_YDS.text());
				 				json.PASS_TD = parseInt(PASS_TD.text());
				 				json.PASS_INT = parseInt(PASS_INT.text());
				 				json.RUSH = parseInt(RUSH.text());
				 				json.RUSH_YDS = parseInt(RUSH_YDS.text());
				 				json.RUSH_TD = parseInt(RUSH_TD.text());
				 				json.REC = parseInt(REC.text());
				 				json.REC_YDS = parseInt(REC_YDS.text());
				 				json.REC_TD = parseInt(REC_TD.text());
				 				json.REC_TAR = parseInt(REC_TAR.text());
				 				json.MISC_FUML = parseInt(MISC_FUML.text());
				 				json.MISC_TD = parseInt(MISC_TD.text());
				 				json.PTS = parseFloat(PTS.text());
							}

							// if filter number is 3, aka kickers (just pull name and points)
							else if (filter_number == "3") {
								
								var json = {
									player: "",
									PTS: ""
								}

								player_row = $(this).children();
								player = player_row.first();
				 				player_name = player.text();
				 				player_name = player_name.slice(0, player_name.indexOf(","));
				 				//console.log(player_name);

				 				PTS = player_row.last();
				 				//console.log(PTS.text());

				 				json.player = player_name;
				 				json.PTS = parseFloat(PTS.text());
							}

							else if (filter_number == "5") {
								
								var json = {
									player: "",
									PTS: ""
								}

								player_row = $(this).children();
								player = player_row.first();
				 				player_name = player.text();
				 				// account for no comma with D/ST
				 				player_name = player_name.slice(0, player_name.indexOf("D/ST") + 4);
				 				//console.log(player_name);

				 				PTS = player_row.last();
				 				//console.log(PTS.text());

				 				json.player = player_name;
				 				json.PTS = parseFloat(PTS.text());								
							}
				 			
				 			//console.log(json);

				 			// if reach end of page, count for callback								
				 			if (json.player == "") {
					 			complete();
				 			}
				 			else {
				 				// if not one of headers, add to database
				 				if ((json.player != "OFFENSIVE PLAYER" && json.player != "KICKER") && json.player != "TEAM D/ST") {
		 							db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).insert(json)
				 				}
				 			}

						}) // end of iterating each row srape
					} // end of if(!error)
				
				}) // end of request

			var complete = function() {
				complete_count += 1;

				if (complete_count == filter_list.length){
					callback();
				}	
			} // end of complete function

			}) // end of for each
		}) // end of collection remove
	}) // end of getting football owner number

}

