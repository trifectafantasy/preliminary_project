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

	db.collection('football_owners').find({"owner_number": parseInt(owner_number)}, {"football_owner_number": 1, "_id": 0}).toArray(function(e, docs) {

		//console.log(docs);
		football_owner_number = docs[0]["football_owner_number"]

		db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).remove({}, function(err, result) {

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

		 				//console.log(json);

		 				db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).insert(json)

					})

					callback();
				} // end of if(!error)
			
			}) // end of request


		}) // end of collection remove

	}) // end of getting football owner number

}

