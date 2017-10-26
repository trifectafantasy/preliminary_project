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
module.exports = function(req, res, db, sport, year, owner_number_list, callback) {

	var complete_count = 0;
	//var owner_number_list = [1, 2];
	//console.log(owner_number_list);

		

	// loop through each owner
	forEach(owner_number_list, function(owner_number ,index, array) {

		db.collection('football_owners').find({"football_owner_number": parseInt(owner_number)}, {"owner_number": 1, "_id": 0}).toArray(function(e, docs) {
			//football_owner_number = owner_number_list[index];

			// clear stats database before scrape
			db.collection("owner" + owner_number + "_" + sport + "_stats_" + year).remove({});			

			// set owner number and football owner number
			owner_number = docs[0]["owner_number"];
			football_owner_number = array[index];

			// scrape active stats depending on football owner number
			var url = 'http://games.espn.com/ffl/activestats?leagueId=154802&seasonId=' + year + '&teamId=' + football_owner_number

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

		 				db.collection("owner" + owner_number + "_" + sport + "_stats_" + year).insert(json)

		 				// if reach end of page, complete
		 				if (json.player == ""){
		 					complete();
		 				}
					}) // end of rows iteration
				} // end of if(!error)
			}) // end of request
		}) // end of football owner number pull

// function that once all owners are done, callback
var complete = function() {
	complete_count += 1;

	if (complete_count == owner_number_list.length){
		callback();
	}	
} // end of complete function

	}) // end of forEach loop
} // end of module exports
