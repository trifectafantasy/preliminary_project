///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

// create callback function
module.exports = function(req, res, db, sport, year, callback) {

	// remove sport + "_trade_history_" + year collection to only have new trades in this database for processing
	db.collection(sport + "_trade_history_" + year).remove({}, function(err, result) {

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
		
		let scrape_all = false;

		if (scrape_all === true) {

			// url for scrape
			if (sport === "football") {
				var url = 'http://games.espn.com/ffl/recentactivity?leagueId=154802&seasonId=' + year + '&activityType=2&startDate=' + year + '0901&endDate=' + end_year + end_month + end_day + '&teamId=-1&tranType=4';
			}

			else if (sport === "basketball") {
				var start_year = String(parseInt(year) - 1);
				var url = 'http://games.espn.com/fba/recentactivity?leagueId=100660&seasonId=' + year + '&activityType=2&startDate=' + start_year + '1010&endDate=' + end_year + end_month + end_day + '&teamId=-1&tranType=4';
			}

			else if (sport === "baseball") {
				var url = 'http://games.espn.com/flb/recentactivity?leagueId=109364&seasonId=' + year + '&activityType=2&startDate=' + year + '0320&endDate=' + end_year + end_month + end_day + '&teamId=-1&tranType=4';
			}
			
			scrape_function(url);
		}

		else {

			db.collection("trade_history").find({"name":"last_scrape_document", "sport": sport}, {"name": 0, "_id": 0}).toArray(function(e, docs) {

				var scrape_year = docs[0]["year"];
				var scrape_month = docs[0]["month"];
				var scrape_day = docs[0]["day"];

				// url for scrape
				if (sport === "football") {
					var url = 'http://games.espn.com/ffl/recentactivity?leagueId=154802&seasonId=' + year + '&activityType=2&startDate=' + scrape_year + scrape_month + scrape_day + '&endDate=' + end_year + end_month + end_day + '&teamId=-1&tranType=4';
				}

				else if (sport === "basketball") {
					var start_year = String(parseInt(year) - 1);
					var url = 'http://games.espn.com/fba/recentactivity?leagueId=100660&seasonId=' + year + '&activityType=2&startDate=' + scrape_year + scrape_month + scrape_day + '&endDate=' + end_year + end_month + end_day + '&teamId=-1&tranType=4';
				}

				else if (sport === "baseball") {
					var url = 'http://games.espn.com/flb/recentactivity?leagueId=109364&seasonId=' + year + '&activityType=2&startDate=' + scrape_year + scrape_month + scrape_day + '&endDate=' + end_year + end_month + end_day + '&teamId=-1&tranType=4';
				}
				//console.log(url);

				db.collection("trade_history").update({"name": "last_scrape_document", "sport": sport}, {"name": "last_scrape_document", "sport": sport, "year": end_year, "month": end_month, "day": end_day});

				scrape_function(url);
			})
		} 
	}) // end of remove database

var scrape_function = function(url) {

	var month_list = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	// initialize number of processed trades
	var trades_processed = 0;

	// request for scrape
	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			scrape = $('tr.tableSubHead');
			//console.log(scrape);
			rows = scrape.siblings();
			//console.log(hello_children.text());

			rows.each(function(j, element) {

				date = $(this).children().first();
				//console.log(date.text());

				date_html = date.html();
				comma_index = date_html.indexOf(",");
				bracket_index = date_html.indexOf("<");
				date_html = date_html.slice(comma_index + 2, bracket_index);
				//console.log(date_html);
				
				month_save = date_html.slice(0, date_html.indexOf(" "));
				//console.log("month", month_save);

				month_index = month_list.indexOf(month_save) + 1;
				month_index_save = ('0' + month_index).slice(-2);
				//console.log(month_index_save);

				day_save = date_html.slice(date_html.indexOf(" ") + 1);
				day_save = ('0' + day_save).slice(-2);
				//console.log("day", day_save);

				if (sport === 'basketball') {

					// if trade made in Oct - Dec, minus 1 of basketball year
					if (month_index >= 10) {
						date_save = String(parseInt(year) - 1) + "/" + month_index_save + "/" + day_save;
					}
					else {
						date_save = year + "/" + month_index_save + "/" + day_save;
					}
				}
				else {
					date_save = year + "/" + month_index_save + "/" + day_save;
				}
				//console.log(date_save);

				type = date.next();
				//console.log(type.text());

				type_slice = type.text().slice(13);
				//console.log(type_slice);

				if (type_slice == "Trade Processed") {

					trades_processed += 1;
					//console.log('');
					//console.log("trade number", trades_processed);
					
					players = type.next();
					//console.log(players.text());

					// string used to find team abbreviations
					owners_involved = players.next();
					//console.log(owners_involved.text());

					// html string used to find team numbers
					owners_html = owners_involved.html();
					//console.log(owners_html);

					html_length = owners_html.length;					

					abbrev_index = owners_involved.text().indexOf("Roster");


					// slice first half of owners involved
					owner1_abbrev_slice = owners_involved.text().slice(0, abbrev_index + 6);
					//console.log(owner1_abbrev_slice);

					abbrev1_index = owners_involved.text().indexOf(" ");

					owner1_abbrev = owner1_abbrev_slice.slice(0, abbrev1_index);
					//console.log("owner1 abbreviation:", owner1_abbrev);
					owner1_abbrev_length = owner1_abbrev.length;
					//console.log(owner1_abbrev.length);


					owner1_html	= owners_html.slice(0, html_length / 2);
					//console.log(owner1_html);
					owner1_id_index = owner1_html.indexOf("teamId=");
					owner1_slice = owner1_html.slice(owner1_id_index, owner1_id_index + 9)
					//console.log(owner1_slice);

					if (owner1_slice.indexOf("\"") != -1) {
						owner1_number = owner1_slice.slice(7,8);
						//console.log("owner1 number:", owner1_number);
					}
					else {
						owner1_number = owner1_slice.slice(7,9);
						//console.log("owner1 number:", owner1_number);
					}


					// slice 2nd half of owners involved
					owner2_abbrev_slice = owners_involved.text().slice(abbrev_index + 6);
					//console.log(owner2_abbrev_slice);

					// pull from space
					abbrev2_index = owners_involved.text().indexOf(" ");

					owner2_abbrev = owner2_abbrev_slice.slice(0, abbrev2_index);
					//console.log("owner2 abbreviation:", owner2_abbrev);
					owner2_abbrev_length = owner2_abbrev.length;

					owner2_html = owners_html.slice(html_length / 2, html_length);
					//console.log(owner2_html);					
					owner2_id_index = owner2_html.indexOf("teamId=");
					owner2_slice = owner2_html.slice(owner2_id_index, owner2_id_index + 9)
					//console.log(owner2_slice);

					if (owner2_slice.indexOf("\"") != -1) {
						owner2_number = owner2_slice.slice(7,8);
						//console.log("owner2 number: ", owner2_number);
					}
					else {
						owner2_number = owner2_slice.slice(7,9);
						//console.log("owner2 number: ", owner2_number);
					}

					full_player_string = players.text();
					//console.log(full_player_string);

					var number_of_traded_players = (full_player_string.match(/traded/g) || []).length;
					//console.log(number_of_traded_players);

					var sliced_player_string = full_player_string;

					for (i = 0; i < number_of_traded_players; i++) {

						portion_index = sliced_player_string.indexOf("to ");
						portion = sliced_player_string.slice(0, portion_index + 7)
						//console.log(portion);

						player_index = portion.indexOf("traded");
						player = portion.slice(player_index + 7, portion.indexOf(","));
						//console.log("player:" , player);

						owner_index = portion.indexOf("to ");
						owner = portion.slice(owner_index + 3, owner_index + 7);
						//console.log("owner:", owner);

						if (owner.indexOf(owner1_abbrev) != -1) {
							//console.log("owner1 match");

							while (owner1_abbrev !== owner) {
								owner = owner.slice(0, owner.length - 1);
								//console.log("removing excess...");
							}

							db.collection(sport + "_trade_history_" + year).insert({"date": date_save, "sport": sport, "trade_number": trades_processed, "player": player, "owner_number": owner1_number})
						}

						else if (owner.indexOf(owner2_abbrev) != -1) {
							//console.log('owner2 match');

							while(owner2_abbrev !== owner) {
								owner = owner.slice(0, owner.length - 1);
								//console.log("removing excess...");
							}

							db.collection(sport + "_trade_history_" + year).insert({"date": date_save, "sport": sport, "trade_number": trades_processed, "player": player, "owner_number": owner2_number})
						}

						else {
							//console.log("no includes")
							owner = owner.slice(0, owner.length - 1);

							if (owner.indexOf(owner1_abbrev.slice(0, owner1_abbrev.length - 1)) != -1) {
								db.collection(sport + "_trade_history_" + year).insert({"date": date_save, "sport": sport, "trade_number": trades_processed, "player": player, "owner_number": owner1_number})
							}
							else if (owner.indexOf(owner2_abbrev.slice(0, owner2_abbrev.length - 1)) != -1) {
								db.collection(sport + "_trade_history_" + year).insert({"date": date_save, "sport": sport, "trade_number": trades_processed, "player": player, "owner_number": owner2_number})
							}
							else {
								//console.log("no cigar");
							}
						}

						sliced_player_string = sliced_player_string.slice(portion_index + 7);

					} // end of for loop
				} // end of if trade processed
			}) // end of table.ptsBased.matchup iteration
		} // end of if(!error)

	}) // end of request
	callback();
}
			
}
