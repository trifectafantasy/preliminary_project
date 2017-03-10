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

var start_scrape = function(url) {
		
		var all_players = [];
		
		// request for scrape
		request(url, function(error, response, html) {

			// if not an error
			if(!error){
				console.log("owner", owner_number);
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

					if (type_slice == "Add/Drop" || type_slice.includes("Add/Drop (")) {
						player_rows = type.next().text();
						//console.log(player_rows);
						added_index = player_rows.indexOf("added ");
						dropped_index = player_rows.indexOf("dropped ");
						if (Math.min(added_index, dropped_index) == added_index) {
							start_index1 = added_index + 6
							start_index2 = dropped_index + 8
						}
						else {
							start_index1 = dropped_index + 8
							start_index2 = added_index + 6
						}
						comma1 = player_rows.indexOf(",", 0)
						player1 = player_rows.slice(start_index1, comma1);
						//console.log(player1);
						all_players.push(player1);
						comma2 = player_rows.indexOf(",", comma1 + 1)
						player2 = player_rows.slice(start_index2, comma2);
						//console.log(comma1, comma2);
						all_players.push(player2);
					}
					else if (type_slice == "Add" || type_slice.includes("Add (")) {
						player_rows = type.next().text();
						added_index = player_rows.indexOf("added ");
						comma = player_rows.indexOf(",")
						player = player_rows.slice(added_index + 6, comma);
						all_players.push(player);
						//console.log(player_rows);						
					}
					else if (type_slice == "Drop" || type_slice.includes("Drop (")) {
						player_rows = type.next().text();
						dropped_index = player_rows.indexOf("dropped ");
						comma = player_rows.indexOf(",")
						player = player_rows.slice(dropped_index + 8, comma);
						all_players.push(player);
						//console.log(player_rows);						
					}
					else if (type_slice == "Draft"){
						player_rows = type.next().text();
						drafted_index = player_rows.indexOf("drafted ");
						comma = player_rows.indexOf(",")
						player = player_rows.slice(drafted_index + 8, comma);
						all_players.push(player);
						//console.log(player_rows);				
					}
					else if (type_slice == "Trade Processed") {
						player_rows = type.next().text();
						//console.log(player_rows);
						comma_list = []
						comma_start = 0
						comma = 0
						while (comma != -1) {
							comma = player_rows.indexOf(",", comma_start + 1);
							comma_list.push(comma);
							comma_start = comma;
						}
						comma_list = comma_list.slice(0, comma_list.length - 1)
						//console.log("length of comma list", comma_list.length);

						start = 0
						for (i = 0; i < comma_list.length; i++) {
							each_comma = comma_list[i];
							traded_index = player_rows.indexOf("traded ", start)
							if (traded_index == -1) {
								traded_index = player_rows.indexOf("ropped ", start)
							}
							player = player_rows.slice(traded_index + 7, each_comma);
							//console.log(player);
							all_players.push(player);
							start = each_comma + 1
						}
					}

				}) // end of rows iteration
			//console.log(all_players);
			insert_json = {}
			insert_json["owner_number"] = owner_number;
			insert_json["all_players"] = all_players;
			db.collection(sport + "_popular_" + year).insert(insert_json)

			} // end of if(!error)
		
		callback();
		}) // end of request
} // end of start_scrape function
		
		if (owner_number == "1") {
			db.collection(sport + "_popular_" + year).remove({})
		}
		
		var url = null;

		if (sport == 'football') {
			// pull football owner number per owner number
			db.collection('football_owners').find({"owner_number": parseInt(owner_number)}, {"football_owner_number": 1, "_id": 0}).toArray(function(e, docs) {

				//console.log(docs);
				football_owner_number = docs[0]["football_owner_number"]

				// use today as end date for query for transactions 
				var d = new Date();
				var end_year = d.getFullYear();
				var end_month = d.getMonth() + 1;
				var end_day = d.getDate();

				// to account for day needing to be 2 digits
				if (end_day < 10) {
					end_day = "0" + String(end_day)
				}		

				// to account for month needing to be 2 digits
				if (end_month < 10) {
					end_month = "0" + String(end_month)
				}

				// url for scrape
				var url = 'http://games.espn.com/ffl/recentactivity?leagueId=154802&seasonId=' + year + '&activityType=2&startDate=' + year + '0801&endDate=' + end_year + end_month + end_day + '&teamId=' + football_owner_number + '&tranType=-2';
				//console.log(url)
				start_scrape(url);
			})
		}
		else if (sport == 'basketball') {
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
			var url = 'http://games.espn.com/fba/recentactivity?leagueId=100660&seasonId=' + year + '&activityType=2&startDate=' + start_year + '1001&endDate=' + end_year + end_month + end_day + '&teamId=' + owner_number + '&tranType=-2';
			//console.log(url)
			start_scrape(url);
			
		}
		else if (sport == 'baseball') {
			// use today as end date for query for transactions 
			var d = new Date();
			var end_year = d.getFullYear();
			var end_month = d.getMonth() + 1;
			var end_day = d.getDate();

			// to account for day needing to be 2 digits
			if (end_day < 10) {
				end_day = "0" + String(end_day)
			}		

			// to account for month needing to be 2 digits
			if (end_month < 10) {
				end_month = "0" + String(end_month)
			}		

			// url for scrape
			var url = 'http://games.espn.com/flb/recentactivity?leagueId=109364&seasonId=' + year + '&activityType=2&startDate=' + year + '0301&endDate=' + end_year + end_month + end_day + '&teamId=' + owner_number + '&tranType=-2';
			//console.log(url)
			start_scrape(url);

		}



}

