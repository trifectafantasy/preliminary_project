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

	// pull list of teams per owner to match with draft results
	db.collection('owner' + owner_number).find({}, {"teams": 1, "_id": 0}).toArray(function(e, docs) {

		team_list = docs[0]["teams"]
		//console.log(team_list);

		new_team_list = [];

		// convert team names to all caps to match draft results page
		for (i = 0; i < team_list.length; i++) {
			team_convert = team_list[i];
			new_team_list.push(team_convert.toUpperCase());
		}

		// url for scrape
		if (sport === 'football') {
			var url = 'http://games.espn.com/ffl/tools/draftrecap?leagueId=154802&seasonId=' + year + '&mode=1'
		}
		else if (sport === 'basketball') {
			var url = 'http://games.espn.com/fba/tools/draftrecap?leagueId=100660&seasonId=' + year + '&mode=1'		
		}
		else if (sport === 'baseball') {
			var url = 'http://games.espn.com/flb/tools/draftrecap?leagueId=109364&seasonId=' + year + '&mode=1'
		}
		
		// request for scrape
		request(url, function(error, response, html) {

			// if not an error
			if(!error){

				// use cheerio to traverse and scrape html 
				var $ = cheerio.load(html);

				var team, all_rows, row, player, draft_position

				// iterate through every team header
				$('tr.tableHead').each(function(j, element) {

					team = $(this).children().children();
					//console.log(team.text());

					// if team matches
					if (new_team_list.includes(team.text())) {
						//console.log("match!");

						var all_rows = $(this).siblings();

						// iterate through all rows in team column of draft results
						all_rows.each(function(k, element) {

							row = $(this);
							//console.log(row.text());

							player_name = row.children().first().next().text();
							//console.log(player_name.text());
							player_index = player_name.indexOf(",");

							// if there is no comma (only D/ST)
							if (player_index == -1) {
								player_index = player_name.indexOf("D/ST") + 4;
							}

							player = player_name.slice(0, player_index);
							//console.log(player);

							draft_position = row.children().first();
							draft_position = parseInt(draft_position.text());
							//console.log(draft_position)

							// update collection per player, but if player no found (player drafted, but no stats accounted, add anyways (upsest = true))
							db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).update({"player": player}, {"$set": {"acquired": "Draft", "draft_position": draft_position}}, {upsert: true})
						}) // end of all rows within team scrape
					} // end of if right team per owner
				}) // end of scrape of team team in league that drafted
			} // end of if(!error)
			
		callback();
		}) // end of request
	}) // end of blanket trade acquire update

}

