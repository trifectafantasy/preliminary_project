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

	// clear collection for fresh scrape
	db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).remove({}, function(err, result) {
	
		var url = 'http://games.espn.com/fba/activestats?leagueId=100660&seasonId=' + year + '&teamId=' + owner_number + '&filter=0';

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

				// iterate through every player
				rows.each(function(j, element) {

					// store scraped data for each team as json
					var json = {
						player: "",
						GP: "",
						FG: "",
						FG_PCT: "",
						FT: "",
						FT_PCT: "",
						THREEPM: "",
						REB: "",
						AST: "",
						STL: "",
						BLK: "",
						TO: "",
						PTS: ""
					}				

					player_row = $(this).children();
					//console.log(player_row.text());
					player = player_row.first();
					GP = player.next().next();
					FG = GP.next();
					FG_PCT = FG.next();
					FT = FG_PCT.next();
					FT_PCT = FT.next();
					THREEPM = FT_PCT.next();
					REB = THREEPM.next();
					AST = REB.next();
					STL = AST.next();
					BLK = STL.next();
					TO = BLK.next();
					PTS = TO.next();

	 				// store each scraped value in json as TEXT, INT, or FLOAT
	 				player_name = player.text();
	 				player_name = player_name.slice(0, player_name.indexOf(","));

	 				json.player = player_name;
	 				json.GP = parseInt(GP.text());
	 				json.FG = FG.text();
	 				json.FG_PCT = parseFloat(FG_PCT.text());
	 				json.FT = FT.text();
	 				json.FT_PCT = parseFloat(FT_PCT.text());
	 				json.THREEPM = parseInt(THREEPM.text());
	 				json.REB = parseInt(REB.text());
	 				json.AST = parseInt(AST.text());
	 				json.STL = parseInt(STL.text());
	 				json.BLK = parseInt(BLK.text());
	 				json.TO = parseInt(TO.text());
	 				json.PTS = parseInt(PTS.text());

	 				//console.log(json);

	 				// if empty player, aka end of list
	 				if (json.player == "") {
	 					callback();
	 				}
	 				else {
	 					// also skip if header of "PLAYER"
	 					if (json.player != "PLAYER") {
	 						// if normal player, insert
	 						db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).insert(json)
	 					}
	 				}

				}) // end of rows iterating scrape
			} // end of if(!error)
		}) // end of request
	}) // end of collection update many

}
