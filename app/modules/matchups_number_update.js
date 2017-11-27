///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

// create callback function
function single_sport(req, res, db, sport, year ,callback) {

	// url for scrape
	if (sport === 'football') {
		var url = "http://games.espn.com/ffl/scoreboard?leagueId=154802&seasonId=" + year;
	}
	else if (sport === 'basketball') {
		var url = "http://games.espn.com/fba/scoreboard?leagueId=100660&seasonId=" + year;
	}
	else if (sport === 'baseball') {
		var url = "http://games.espn.com/flb/scoreboard?leagueId=109364&seasonId=" + year;
	}


	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			var title = $('div.games-pageheader').text();
			console.log(title);


			// if football, look for "Week"
			if (title.indexOf("Week") != -1) {
				console.log("FOOTBALL");

				var completed_matchups = parseInt(title.slice(title.indexOf(" ", title.length) - 1));
				//console.log(completed_matchups, typeof completed_matchups)
			}

			else if (title.indexOf("Matchup") != -1) {
				console.log("BASKETBALL/BASEBALL");

				var completed_matchups = parseInt(title.slice(title.indexOf(" ", title.length) - 1));
				//console.log(completed_matchups, typeof completed_matchups)				
			}

			else if (title.indexOf("Round")) {
				console.log("REGULAR SEASON OVER");

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
			console.log(key);


			var json = {};
			json[key] = completed_matchups;

			console.log(json);

			request.put({url: "http://localhost:8081/utility/season_variables", form: json}, function(err, response, body) {
				console.log(response.body);
			})


		} // end of if(!error)
	
	callback();
	}) // end of request
}

module.exports = {
	single_sport


}

