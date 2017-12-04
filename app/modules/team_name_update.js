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
module.exports = function(req, res, db, sports_list, year_list, owner_number, callback) {

	let scrape_type, year1, year2;

	if (year_list.length == 1) {
		scrape_type = "single_sport";
		year1 = year_list[0];
		year2 = null;
	}
	else {
		scrape_type = "multiple_sports";
		year1 = year_list[0];
		year2 = year_list[1];
	}

	var complete_count = 0;

	// clear collection to start fresh
	db.collection("football_owners").find({"owner_number": parseInt(owner_number)}, {"football_owner_number": 1, "_id": 0}).toArray(function(e, docs){
		//console.log(docs);

		var football_owner_number = docs[0]["football_owner_number"];

		sports_list.forEach(function(sport, index) {
			//console.log("sport", sports_list);

			// setTimeout to delay for API calls
			setTimeout(function() {

				// set URL per sport
				if (sport === "football") {
					if (scrape_type === "single_sport") {
						var url = "http://games.espn.com/ffl/clubhouse?leagueId=154802&teamId=" + football_owner_number + "&seasonId=" + year1;
					}
					else {
						var url = "http://games.espn.com/ffl/clubhouse?leagueId=154802&teamId=" + football_owner_number + "&seasonId=" + year1;
					}
				}

				else if (sport === "basketball") {
					if (scrape_type === "single_sport") {
						var url = "http://games.espn.com/fba/clubhouse?leagueId=100660&teamId=" + owner_number + "&seasonId=" + year1;
					}
					else {
						var url = "http://games.espn.com/fba/clubhouse?leagueId=100660&teamId=" + owner_number + "&seasonId=" + year2;
					}
				}

				else if (sport === "baseball") {
					if (scrape_type === "single_sport") {
						var url = "http://games.espn.com/flb/clubhouse?leagueId=109364&teamId=" + owner_number + "&seasonId=" + year1;
					}
					else {
						var url = "http://games.espn.com/flb/clubhouse?leagueId=109364&teamId=" + owner_number + "&seasonId=" + year2;
					}
				}

				// request for scrape
				request(url, function(error, response, html) {

					// if not an error
					if(!error){

						// use cheerio to traverse and scrape html 
						var $ = cheerio.load(html);

						team_name = $('h3.team-name').text();
						//console.log(team_name);

						team_name = team_name.slice(0, team_name.indexOf("(") - 1);
						//console.log(team_name);

						// POST request to add team name to database
						request.post({url: "http://localhost:8081/utility/add_team_name", method: "POST", form: {owner_number: owner_number, team_name: team_name}}, function(err, response, body) {
							//console.log(response.statusCode);

							// if response code is 200, send to complete()
							if (response.statusCode === 200) {
								//console.log("OK!");
								complete();
							}
						}); // end of request to /utility/add_team_name
					} // end of if(!error)
				}) // end of request
			}, 200) // end of setTimeout


		// complete function that when both filters are done, callback
		var complete = function() {
			complete_count += 1;

			if (complete_count == sports_list.length){
				callback();
			}	
		} // end of complete function

		}) // end of for each
	}) // end of collection remove
}
