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

	db.collection(sport + "_draft_" + year).remove({}, function(err, results) {

		// url for scrape
		if (sport === 'football') {
			var url = 'http://games.espn.com/ffl/tools/draftrecap?leagueId=154802&seasonId=' + year + '&mode=0'
		}
		else if (sport === 'basketball') {
			var url = 'http://games.espn.com/fba/tools/draftrecap?leagueId=100660&seasonId=' + year + '&mode=0'		
		}
		else if (sport === 'baseball') {
			var url = 'http://games.espn.com/flb/tools/draftrecap?leagueId=109364&seasonId=' + year + '&mode=0'
		}
		
		// request for scrape
		request(url, function(error, response, html) {

			// if not an error
			if(!error){

				// use cheerio to traverse and scrape html 
				var $ = cheerio.load(html);

				var round, row, player, draft_position, team

				// iterate through every team header
				$('tr.tableHead').each(function(j, element) {

					round = $(this).siblings();
					//console.log(round.text());

					round.each(function(k, element) {

						json = {};

						row = $(this).children();
						//console.log(row.text());

						draft_position = row.first();
						//console.log(draft_position.text());

						player_pull = draft_position.next();
						player_name = player_pull.text();
						player_index = player_name.indexOf(",");
						// if there is no comma (only D/ST)
						if (player_index == -1) {
							player_index = player_name.indexOf("D/ST") + 4;
						}
						player = player_name.slice(0, player_index);
						//console.log(player);

						// if basketball 2016, need to pull team name (owner name) to account for Team Fongs
						if (sport == 'basketball' && year == 2016){
							team_html = player_pull.next().html();
							//console.log(team);
							index1 = team_html.indexOf("title=") + 7
							index2 = team_html.indexOf("href=") - 2
							team = team_html.slice(index1, index2);
							team = team.replace("&apos;", "\'")
							//console.log(team)
						}
						else {
							team = player_pull.next();
							team = team.text();
							//console.log(team);
						}

						json["player"] = player;
						json["draft_position"] = parseInt(draft_position.text());
						json["team"] = team;
						//console.log(json);

						db.collection(sport + "_draft_" + year).insert(json);

					}) // end of each pick in each round

				}) // end of scrape of team round
			} // end of if(!error)
			
		callback();
		}) // end of request
	}) // end of remove

}

