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

	db.collection('owner' + owner_number).find({}, {"teams": 1, "_id": 0}).toArray(function(e, docs) {

		team_list = docs[0]["teams"]
		//console.log(team_list);

		new_team_list = [];

		for (i = 0; i < team_list.length; i++) {
			team_convert = team_list[i];
			new_team_list.push(team_convert.toUpperCase());
		}

		// url for scrape
		var url = 'http://games.espn.com/fba/tools/draftrecap?leagueId=100660&seasonId=' + year + '&mode=1'		
		
		// request for scrape
		request(url, function(error, response, html) {

			//console.log(new_team_list)

			// if not an error
			if(!error){

				// use cheerio to traverse and scrape html 
				var $ = cheerio.load(html);

				var team, all_rows, row, player, draft_position

				// iterate through every game in the week

				$('tr.tableHead').each(function(j, element) {
					team = $(this).children().children();
					//console.log(team.text());

					if (new_team_list.includes(team.text())) {
						//console.log("match!");

						var all_rows = $(this).siblings();

						all_rows.each(function(k, element) {

							row = $(this);
							//console.log(row.text());

							player_name = row.children().first().next().text();
							//console.log(player_name.text());
							player_index = player_name.indexOf(",");
							if (player_index == -1) {
								player_index = player_name.indexOf("D/ST") + 4;
							}
							player = player_name.slice(0, player_index);
							//console.log(player);

							draft_position = row.children().first();
							draft_position = parseInt(draft_position.text());
							//console.log(draft_position)

							db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).update({"player": player}, {"$set": {"acquired": "Draft", "draft_position": draft_position}}, {upsert: true})
						})

					}

				})


			} // end of if(!error)
			
		//console.log("last add");
		callback();
		}) // end of request

	})		

}

