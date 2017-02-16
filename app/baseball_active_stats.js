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

	// list for possible filters for hitters and pitchers
	var filter_list = ["1", "2"];

	// clear collection to start fresh
	db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).remove({}, function(err, result) {

		filter_list.forEach(function(filter_number, index) {
			//console.log("filter", filter_number)

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

						// if filter is 1 aka hitters
						if (filter_number == "1") {
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
								OBP: ""
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

			 				//console.log(json);
						}

						// if filter number is 2 aka pitchers
						else if (filter_number == "2") {

							var json = {
								player: "",
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

			 				player_name = player.text();
			 				player_name = player_name.slice(0, player_name.indexOf(","));
			 				//console.log(player_name);


			 				json.player = player_name;
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

			 				//console.log(json);
						}

						if (json.player == "") {
							complete();
						}
						else if (json.player != "BATTER" && json.player != "PITCHER") {
			 				db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).insert(json)

						} 
			 			
					}) // end of rows iterations
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
}

