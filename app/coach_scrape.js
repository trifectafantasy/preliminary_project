///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');
var math = require('mathjs');

var mongo = require('mongodb');
var assert = require('assert');
// create callback function
module.exports = function(req, res, db, year, owner_number, completed_weeks, callback) {

	var complete_count = 0;
	var week_list = math.range(1, completed_weeks + 1);

	// clear collection to reset for scrape
	db.collection("owner" + owner_number + "_coach_scrape_" + year).remove({}, function(err, results) {

		// pull football owner number per owner number
		db.collection('football_owners').find({"owner_number": parseInt(owner_number)}, {"football_owner_number": 1, "_id": 0}).toArray(function(e, docs) {

			football_owner_number = docs[0]["football_owner_number"]
			//console.log(football_owner_number)
		
			week_list.forEach(function(week, index) {

				var url = 'http://games.espn.com/ffl/boxscorequick?leagueId=154802&teamId=' + football_owner_number + '&scoringPeriodId=' + week + '&seasonId=' + year + '&view=scoringperiod&version=quick';

				// request for scrape
				request(url, function(error, response, html) {

					// if not an error
					if(!error){

						// use cheerio to traverse and scrape html 
						var $ = cheerio.load(html);

						// scrape header of each team's starter and bench (4 total)
						$('tr.playerTableBgRowSubhead.tableSubHead.playertableSectionHeader').each(function(j, element) {

							// initialize variables
							var player_row, lineup_position, players, points, eligible_position
							
							scrape = $(this);
							//console.log(type.text());

							// if one of first 2 scrapes (first team's starters and bench)
							if (j == 0 || j == 1) {

								type = scrape.children();
								//console.log(type.text());

								// if headers == starters
								if (type.text() === "STARTERS") {
									//console.log("starters");
									starters_rows = scrape.siblings();
									//console.log(starters_rows.text());

									// scrape through each player in starters
									starters_rows.each(function(k, elem) {
										player_row = $(this);

										// skip headers
										if (k != 0 && k != 1) {

											lineup_position = player_row.children().first();
											//console.log(lineup_position.text());
											players = player_row.children().first().next();
											players = players.text();
											//console.log(players);

											// remove injury(Questionable, Doubtful, Out)/suspended designation
											if (players.charAt(players.length - 1) === "Q") {
												full_player = players.slice(0, players.length - 3);
											}
											else if (players.charAt(players.length - 1) === "D") {
												// if Doubtful (D)
												if (players.charAt(players.length - 2) === " ") {
													full_player = players.slice(0, players.length - 3);
												}
												// if Suspended (SSPD)
												else {
													full_player = players.slice(0, players.length - 6);
												}
											}
											else if (players.charAt(players.length - 1) === "O") {
												full_player = players.slice(0, players.length - 3);
											}
											else {
												full_player = players;
											}
											//console.log(full_player);

											// if position is kicker, or defense, (neither position is 2 characters length)
											if (full_player.charAt(full_player.length - 1) === "K") {
												eligible_position = "K"
											}
											else if (full_player.charAt(full_player.length - 1) === "T") {
												eligible_position = "D/ST"
											}
											else {
												eligible_position = full_player.slice(full_player.length - 2);
											}
											//console.log(eligible_position);

											points_scrape = player_row.children().last();
											//console.log(points_scrape.text());
											if (points_scrape.text() == "--") {
												points = 0;
											}
											else {
												points = parseFloat(points_scrape.text());
											}
											//console.log(points);

											// upsert to starters collection per week
											db.collection("owner" + owner_number + "_coach_scrape_" + year).update({"week": week, "status": "starters"}, {"$push": {[lineup_position.text()]: points}}, {upsert: true})

											// upsert to all collection per week
											db.collection("owner" + owner_number + "_coach_scrape_" + year).update({"week": week, "status": "all"}, {"$push": {[eligible_position]: points}}, {upsert: true})
										} // end of skip headers
									}) // end of per player row iteration	
								} // end of if starters

								// if not starters, bench
								else {
									//console.log("bench");
									bench_rows = scrape.siblings();
									//console.log(bench_rows.text());

									// iterate through each player on the bench
									bench_rows.each(function(k, elem) {
										player_row = $(this);

										// skip header
										if (k != 0) {

											players = player_row.children().first().next();
											players = players.text();
											//console.log(players);
											//console.log(players.slice(0, players.indexOf(",")));

											// remove injury (Questionable, Doubtful, Out)/suspended designation
											if (players.charAt(players.length - 1) === "Q") {
												full_player = players.slice(0, players.length - 3);
											}
											else if (players.charAt(players.length - 1) === "D") {
												// if Doubtful (D)
												if (players.charAt(players.length - 2) === " ") {
													full_player = players.slice(0, players.length - 3);
												}
												// if Suspended (SSPD)
												else {
													full_player = players.slice(0, players.length - 6);
												}
											}
											else if (players.charAt(players.length - 1) === "O") {
												full_player = players.slice(0, players.length - 3);
											}
											else {
												full_player = players;
											}
											//console.log(full_player);

											// if position is kicker, or defense, if neither position is 2 characters length
											if (full_player.charAt(full_player.length - 1) === "K") {
												eligible_position = "K"
											}
											else if (full_player.charAt(full_player.length - 1) === "T") {
												eligible_position = "D/ST"
											}
											else {
												eligible_position = full_player.slice(full_player.length - 2);
											}
											//console.log(eligible_position);									

											points_scrape = player_row.children().last();
											//console.log(points_scrape.text());
											if (points_scrape.text() == "--") {
												points = 0;
											}
											else {
												points = parseFloat(points_scrape.text());
											}
											//console.log(points);

											// upsert to all collection
											db.collection("owner" + owner_number + "_coach_scrape_" + year).update({"week": week, "status": "all"}, {"$push": {[eligible_position]: points}}, {upsert: true})

										} // end of don't scrape headers
									}) // end of rows scrape
								} // end of bench scrape
							} // end of if team 1
						}) // end of initial scrape

					} // end of if(!error)
				}) // end of request
			complete();
			}) // end of forEach loop for each week
		}) // end of getting football owner number
	}) // end of remove of scrape

// if all weeks necessary are done, callback
var complete = function() {
	complete_count += 1;
	if (complete_count === completed_weeks) {
		callback();
	}
} // end of complete function

}