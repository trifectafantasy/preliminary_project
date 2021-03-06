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
function update_matchups(req, res, db, sports_list, year1, year2, callback) {

	var json = {};
	
	sports_list.forEach(function(sport, index) {

		// url for scrape
		if (sport === 'football') {
			var url = "http://games.espn.com/ffl/scoreboard?leagueId=154802&seasonId=" + year1;
		}
		else if (sport === 'basketball') {
			var url = "http://games.espn.com/fba/scoreboard?leagueId=100660&seasonId=" + year2;
		}
		else if (sport === 'baseball') {
			var url = "http://games.espn.com/flb/scoreboard?leagueId=109364&seasonId=" + year2;
		}
		//console.log(url);

		request(url, function(error, response, html) {

			// if not an error
			if(!error){

				// use cheerio to traverse and scrape html 
				var $ = cheerio.load(html);

				var title = $('div.games-pageheader').text();
				//console.log(title);

				// if football, look for "Week"
				if (title.indexOf("Week") != -1) {
					var completed_matchups = parseInt(title.slice(title.indexOf(" ", title.length) - 1)) - 1;
					//console.log(completed_matchups, typeof completed_matchups)
				}

				// if basketball/baseball, look for "Matchup"
				else if (title.indexOf("Matchup") != -1) {

					// remove paranthetical dates to leave just matchup number
					title = title.slice(0, title.indexOf("(") - 1);

					var completed_matchups = parseInt(title.slice(title.indexOf(" ", title.length) - 1)) - 1;
					//console.log(completed_matchups, typeof completed_matchups)				
				}

				// if has "Round", then in playoffs so set max completed matchups
				else if (title.indexOf("Round")) {
					//console.log("REGULAR SEASON OVER");

					if (sport === 'football') {
						var completed_matchups = 13;
					}
					else if (sport === 'basketball') {
						var completed_matchups = 18;
					}
					else if (sport === 'baseball') {
						var completed_matchups = 22;
					}
				}

				var key = sport + "_completed_matchups";
				json[key] = completed_matchups;

				// if as many keys are in json as number of sports to update
				if (Object.keys(json).length === sports_list.length) {
					//console.log("JSON", json);
					
					request.put({url: "http://localhost:8081/utility/season_variables", form: json}, function(err, response, body) {
						//console.log(response.body);
					})

					callback();
				}
			} // end of if(!error)
		}) // end of request
	}) // end of forEach loop

} // end of update_matchups function

module.exports = {
	update_matchups
}

