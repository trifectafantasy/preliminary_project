///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');
// create callback function
module.exports = function(req, res, db, sport, year, owner_number_list, callback) {

	var complete_count = 0;
	
	// list of filters for active stats scrape 
	var hitters_pitchers = ["1", "2"];

	// iterate through every owner number
	owner_number_list.forEach(function(owner_number, index) {
		
		//console.log(owner_number);

		// iterate through each filter
		hitters_pitchers.forEach(function(filter_number, index) {

			// set and remove collection asynchronously 
			db.collection("owner" + owner_number + "_" + sport + "_stats_" + year).remove({}, function(err, result) {

				var url = 'http://games.espn.com/flb/activestats?leagueId=109364&seasonId=' + year + '&teamId=' + owner_number + '&filter=' + filter_number

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

			 				// scrape and set variables for hitters
							if (filter_number == 1) {

								// store scraped data for each team as json
								var json = {
									player: "",
									GP: "",
									AB: "",
									H: "",
									R: "",
									HR: "",
									RBI: "",
									BB: "",
									SO: "",
									SB: "",
									OBP: "",
									IP: "",
									HA: "",
									ER: "",
									BBA: "",
									K: "",
									QS: "",
									W: "",
									SV: "",
									ERA: "",
									WHIP: ""
								}				

								player_row = $(this).children();
								//console.log(player_row.text());
								player = player_row.first();
								GP = player.next().next();
								AB = GP.next();
								H = AB.next();
								R = H.next();
								HR = R.next();
								RBI = HR.next();
								BB = RBI.next();
								SO = BB.next();
								SB = SO.next();
								OBP = SB.next();

				 				// store each scraped value in json as TEXT, INT, or FLOAT
				 				player_name = player.text();
				 				player_name = player_name.slice(0, player_name.indexOf(","));

				 				json.player = player_name;
				 				json.GP = parseInt(GP.text());
				 				json.AB = parseInt(AB.text());
				 				json.H = parseInt(H.text());
				 				json.R = parseInt(R.text());
				 				json.HR = parseInt(HR.text());
				 				json.RBI = parseInt(RBI.text());
				 				json.BB = parseInt(BB.text());
				 				json.SO = parseInt(SO.text());
				 				json.SB = parseInt(SB.text());
				 				json.OBP = parseFloat(OBP.text());
				 				json.IP = 0.0;
				 				json.HA = 0;
				 				json.ER = 0;
				 				json.BBA = 0;
				 				json.K = 0;
				 				json.QS = 0;
				 				json.W = 0;
				 				json.SV = 0;
				 				json.ERA = 0.0;
				 				json.WHIP = 0.0;				 				
			 				}

			 				// scrape and set variables for pitchers
			 				else if (filter_number == 2) {

								// store scraped data for each team as json
								var json = {
									player: "",
									GP: "",
									AB: "",
									H: "",
									R: "",
									HR: "",
									RBI: "",
									BB: "",
									SO: "",
									SB: "",
									OBP: "",
									IP: "",
									HA: "",
									ER: "",
									BBA: "",
									K: "",
									QS: "",
									W: "",
									SV: "",
									ERA: "",
									WHIP: ""
								}				
			
								player_row = $(this).children();
								//console.log(player_row.text());
								player = player_row.first();
								IP = player.next().next();
								HA = IP.next();
								ER = HA.next();
								BBA = ER.next();
								K = BBA.next();
								QS = K.next();
								W = QS.next();
								SV = W.next();
								ERA = SV.next();
								WHIP = ERA.next();

				 				// store each scraped value in json as TEXT, INT, or FLOAT
				 				player_name = player.text();
				 				player_name = player_name.slice(0, player_name.indexOf(","));

				 				json.player = player_name;
				 				json.GP = 0;
				 				json.AB = 0;
				 				json.H = 0;
				 				json.R = 0;
				 				json.HR = 0;
				 				json.RBI = 0;
				 				json.BB = 0;
				 				json.SO = 0;
				 				json.SB = 0;
				 				json.OBP = 0.0;			 				
				 				json.IP = parseFloat(IP.text());
				 				json.HA = parseInt(HA.text());
				 				json.ER = parseInt(ER.text());
				 				json.BBA = parseInt(BBA.text());
				 				json.K = parseInt(K.text());
				 				json.QS = parseInt(QS.text());
				 				json.W = parseInt(W.text());
				 				json.SV = parseInt(SV.text());
				 				json.ERA = parseFloat(ERA.text());
				 				json.WHIP = parseFloat(WHIP.text());
			 				}
			 				else {
			 					console.log("filter number no funciona");
			 				}
			 				//console.log("inserted");

			 				if (json.player == ""){
			 					complete();
			 				}
			 				else {
			 					db.collection("owner" + owner_number + "_" + sport + "_stats_" + year).insert(json)
			 				}

						}) // end of each row
					} // end of if(!error)
				}) // end of request
			}) // end of remove

			// complete function that when each owner and 2 filters on each owner are done
			var complete = function() {
				complete_count += 1;

				if (complete_count == (owner_number_list.length * 2)){
					callback();
				}	
			} // end of complete function
		}) // end of filter forEach loop

	}) // end of owner forEach loop
}

