///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

module.exports = function(req, res, db, owner_number, year1, year2, football_in_season, football_completed_matchups, football_completed_season, basketball_in_season, basketball_completed_matchups, basketball_completed_season, baseball_in_season, baseball_completed_matchups, baseball_completed_season) {

///// SET VARIABLES //////
	// Set constant variables for all sports use

	// variables that will never change
	var complete_count = 0;
	var sports_in_season_number = 0
	var disp_football_matchups = null;
	var disp_basketball_matchups = null;
	var disp_baseball_matchups = null;


///// DEFINE FUNCTIONS USED BY ALL SPORTS /////

// complete function that when all in season sports have been pulled
var complete = function() {

	// iterate once whenever an individual sport is finished pulling/scraping
	complete_count += 1;

	// once all in season sports have been pulled
	if (complete_count == sports_in_season_number) {
		console.log("ready to display");

		// if baseball (and therefore all sports) is in season
		if (baseball_in_season == true) {
			setTimeout(function () {
				// pull from mongodb and display new data after python script finishes, but wait 2 seconds to let mongodb finish
				db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
					//console.log(docs);
					//console.log("Displaying football matchup data...")
					disp_football_matchups = docs;
					// call display to see if all finds are done
					display();
				});

				db.collection("owner" + owner_number + "_basketball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
					//console.log(docs);
					//console.log("Displaying basketball matchup data...")
					disp_basketball_matchups = docs;
					// call display to see if all finds are done
					display();
				});

				db.collection("owner" + owner_number + "_baseball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
					//console.log(docs);
					//console.log("Displaying baseball matchup data...")
					disp_baseball_matchups = docs;
					// call display to see if all finds are done
					display();
				});	
			}, 2000)
		}

		// if basketball (and therefore football) is in season
		else if (basketball_in_season == true) {
			setTimeout(function() {
				// pull from mongodb and display new data after python script finishes, but wait 2 seconds to let mongodb finish
				db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
					//console.log(docs);
					//console.log("Displaying football matchup data...")
					disp_football_matchups = docs;
					// call display to see if all finds are done
					display();
				});

				db.collection("owner" + owner_number + "_basketball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
					//console.log(docs);
					//console.log("Displaying basketball matchup data...")
					disp_basketball_matchups = docs;
					// call display to see if all finds are done
					display();
				});
			}, 2000);
		}

		else {
			setTimeout(function() {
				// pull from mongodb and display new data after python script finishes, but wait 2 seconds to let mongodb finish
				db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
					//console.log(docs);
					//console.log("Displaying football matchup data...")
					disp_football_matchups = docs;
					// call display to see if all finds are done
					display();
				});				
			}, 2000);
		}

	} // end of if all in season sports are ready
} // end of complete function

// display function that when all individual in seaason sports have been pulled
var display = function() {

	// if baseball (and therefore all sports) is in season
	if (baseball_in_season == true) {

		// if all of the necessary matchup documents are filled
		if ((disp_football_matchups != null && disp_basketball_matchups != null) && disp_baseball_matchups != null) {

			// set python arguments
			var options = {
				args: [owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season]
			}

			// season over, don't need to recalculate matchups, just pull
			if (baseball_completed_season === true) {
				// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying Trifecta owner matchups...");
					console.log("");
					var disp_trifecta_matchups = docs;

					// render owner_matchups
					res.render('owner_matchups', {
						year1: year1, 
						year2: year2,
						owner: owner_name,
						football_matchups: disp_football_matchups,
						basketball_matchups: disp_basketball_matchups,
						baseball_matchups: disp_baseball_matchups,
						football_in_season: football_in_season,
						basketball_in_season: basketball_in_season,
						baseball_in_season: baseball_in_season,
						trifecta_matchups: disp_trifecta_matchups
					})

				}) // end of trifecta matchups read

			}			

			// if the baseball regular season (the last regular season), is not finished, need to recalculate matchups
			else {
				// run owner_matchups python script to calculate owner matchup stats
				pyshell.run('python/owner_matchups.py', options, function(err) {
					if (err) throw err;
					console.log("owner matchup python script complete");

					// read total trifecta season matchup collection
					db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
						console.log("Displaying Trifecta owner matchups...");
						console.log("");
						var disp_trifecta_matchups = docs;

						// render owner_matchups
						res.render('owner_matchups', {
							year1: year1, 
							year2: year2,
							owner: owner_name,
							football_matchups: disp_football_matchups,
							basketball_matchups: disp_basketball_matchups,
							baseball_matchups: disp_baseball_matchups,
							football_in_season: football_in_season,
							basketball_in_season: basketball_in_season,
							baseball_in_season: baseball_in_season,
							trifecta_matchups: disp_trifecta_matchups
						})

					}) // end of trifecta matchups read
				}) // end of pyshell
			}

		}
	} // end of if baseball in season

	// if basketball (and therefore football) is in season
	else if (basketball_in_season == true) {

		// if all the necessary matchup documents are filled
		if (disp_football_matchups != null && disp_basketball_matchups != null) {

			// set python arguments
			var options = {
				args: [owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season]
			}

			// season over, just pull
			if (basketball_completed_season === true) {
				// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying trifecta owner matchups...");
					console.log("");
					var disp_trifecta_matchups = docs;

					// render owner_matchups
					res.render('owner_matchups', {
						year1: year1, 
						year2: year2,
						owner: owner_name,
						football_matchups: disp_football_matchups,
						basketball_matchups: disp_basketball_matchups,
						football_in_season: football_in_season,
						basketball_in_season: basketball_in_season,
						baseball_in_season, baseball_in_season,
						trifecta_matchups: disp_trifecta_matchups
					})
				}) // end of trifecta matchups read				
			}
			else {
				// run owner mathups python script to calculate owner matchup stats
				pyshell.run('python/owner_matchups.py', options, function(err) {
					if (err) throw err;
					console.log("owner matchup python script complete");

					// read total trifecta season matchup collection
					db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
						console.log("Displaying trifecta owner matchups...");
						console.log("");
						var disp_trifecta_matchups = docs;

						// render owner_matchups
						res.render('owner_matchups', {
							year1: year1, 
							year2: year2,
							owner: owner_name,
							football_matchups: disp_football_matchups,
							basketball_matchups: disp_basketball_matchups,
							football_in_season: football_in_season,
							basketball_in_season: basketball_in_season,
							baseball_in_season, baseball_in_season,
							trifecta_matchups: disp_trifecta_matchups
						})
					}) // end of trifecta matchups read
				}) // end of pyshell
			}
		}
	} // end of if basketball in season

	// if just football is in season
	else {

		// if necessary matchup docuements are filled
		if (disp_football_matchups != null) {

			// set python arguments
			var options = {
				args: [owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season]
			}

			// season over, just pull
			if (baseball_completed_season === true)	{
				// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying Trifecta owner matchups...");
					console.log("");
					var disp_trifecta_matchups = docs;

					// render owner_matchups
					res.render('owner_matchups', {
						year1: year1, 
						year2: year2,
						owner: owner_name,
						football_matchups: disp_football_matchups,
						football_in_season: football_in_season,
						basketball_in_season: basketball_in_season,
						baseball_in_season: baseball_in_season,
						trifecta_matchups: disp_trifecta_matchups
					})
				}) // end of trifecta matchups read				
			}
			else {
				// run owner matchup python script to calculate owner matchup data
				pyshell.run('python/owner_matchups.py', options, function(err) {
					if (err) throw err;
					console.log("owner matchup python script complete");

						// read total trifecta season matchup collection
					db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
						console.log("Displaying Trifecta owner matchups...");
						console.log("");
						var disp_trifecta_matchups = docs;

						// render owner_matchups
						res.render('owner_matchups', {
							year1: year1, 
							year2: year2,
							owner: owner_name,
							football_matchups: disp_football_matchups,
							football_in_season: football_in_season,
							basketball_in_season: basketball_in_season,
							baseball_in_season: baseball_in_season,
							trifecta_matchups: disp_trifecta_matchups
						})
					}) // end of trifecta matchups read
				})	// end of pyshell
			}
		}
	} // end of if just football in season

	
} // end of display function definition

///// EXECUTE SCRIPT /////

	// count how many sports are in season so know when to stop in complete()
	var sports_in_season_list = [football_in_season, basketball_in_season, baseball_in_season];
	for (c = 0; c < sports_in_season_list.length; c++) {
		if (sports_in_season_list[c] == true){
			sports_in_season_number += 1;
		}
	}
	
	console.log("sports in season:", sports_in_season_number);

	// pull list of all teams and their respective owners once at the beginning for reference
	db.collection("owners_per_team_name").find({}, {"_id": 0}).toArray(function(e, docs2) {
		owners_per_team_name_list = docs2[0];
	});

	// pull owner's name for all pulls and/or scrapes
	db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"];
		//console.log(owner_name);
	});

// FOOTBALL //

	// initialize variable for football complete function
	var football_iterate_complete = 0;

	// if football is in season, don't skip
	if (football_in_season == true) {

		// if football is in season (aka in regular season), SCRAPE
		if (football_completed_season == false) {

			// clear football_matchups_scrape collection
			db.collection("owner" + owner_number + "_football_matchups_scrape_" + year1).remove({})

			// pull owner name and list of team names per owner
			db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
				owner_name = docs[0]["owner"];
				//console.log(owner_name);
				owner_team_list = docs[0]["teams"];
				//console.log(owner_team_list);

				// initialize variables used for football scrape
				var football_team1, football_score1, football_team2, football_score2, football_opposing_owner, football_my_team, football_opposing_team
				var football_wins, football_losses, football_ties, PF, PA, pt_diff
				//var football_matchup_number = 1
				//console.log(football_completed_matchups);

				// loop through however many completed football matchups there are (weeks/matchups in regular season)
				for (football_matchup_number = 1; football_matchup_number < football_completed_matchups + 1; football_matchup_number++) {

					// url for football "Scoreboard"
					var url = 'http://games.espn.com/ffl/scoreboard?leagueId=154802&seasonId=' + year1 + '&matchupPeriodId=' + football_matchup_number;

					request(url, function(error, response, html) {

						// if not an error
						if(!error){

							// use cheerio to traverse and scrape html 
							var $ = cheerio.load(html);

							// iterate through every game in the week
							$('table.ptsBased.matchup').each(function(j, element) {

								// reset these scrape variables each time
								football_wins = 0;
								football_losses = 0;
								football_ties = 0;
								PF = 0;
								PA = 0;

								// traverse and find team1 name and score (have to remove pesky abbreviation)
								football_team1 = $(this).children().first().children().children().first();
								var paren1 = football_team1.text().indexOf("(");
								football_team1 = football_team1.text().slice(0, paren1 - 1);
								//console.log(football_team1);
								football_score1 = $(this).children().first().children().next();
								//console.log(football_score1.text());

								// traverse and find team2 name and score (have to remove pesky abbreviation)
								football_team2 = $(this).children().next().children().children().first();
								var paren2 = football_team2.text().indexOf("(");
								football_team2 = football_team2.text().slice(0, paren2 - 1);
								//console.log(football_team2);
								football_score2 = $(this).children().next().children().next();
								//console.log(football_score2.text());

								// if team1 is in list of teams of the owner
								if (owner_team_list.indexOf(football_team1) != -1) {

									// set team names
									football_my_team = football_team1;
									football_opposing_team = football_team2;

									while (football_opposing_team.indexOf(".") != -1) {
										football_opposing_team = football_opposing_team.replace(".", "\\uff0E");
									}
									//console.log(football_my_team);
									//console.log(football_opposing_team);

									// set points for and against
									PF = parseFloat(football_score1.text()).toFixed(1);
									PA = parseFloat(football_score2.text()).toFixed(1);

									// find opposing owner per opposing team
									football_opposing_owner = owners_per_team_name_list["teams"][football_opposing_team]["owner"]
									//console.log(football_opposing_owner);
								}

								// if team2 is in list of teams of the owner
								else if (owner_team_list.indexOf(football_team2) != -1) {
									
									//set team names
									football_my_team = football_team2;
									football_opposing_team = football_team1;

									while (football_opposing_team.indexOf(".") != -1) {
										football_opposing_team = football_opposing_team.replace(".", "\\uff0E");
									}
									//console.log(football_my_team);
									//console.log(football_opposing_team);	

									// set points for and against
									PF = parseFloat(football_score2.text()).toFixed(1);
									PA = parseFloat(football_score1.text()).toFixed(1);

									// find opposing owner per opposing team
									football_opposing_owner = owners_per_team_name_list["teams"][football_opposing_team]["owner"]
									//console.log(football_opposing_owner);
								}

								// if PF and PA were set (aka, this is the matchup we want)
								if (PF != 0 && PA != 0) {

									// insert to scrape collection
									db.collection('owner' + owner_number + "_football_matchups_scrape_" + year1).insert({"opposing_owner": football_opposing_owner, "PF": PF, "PA": PA})

									// call football_complete to see if all mathups are done
									football_complete();
								}
								
							}) // end of table.ptsBased.matchup iteration
						} // end of if(!error)
					}) // end of request
				} // end of for loop

			}) // end of owner team collection

		}  // end of if playoffs

		// if season is over, skip straight to displaying
		else {
			console.log("football already done");

			// tell overall complete that football scraping and processing is done 
			complete();
		} // end of else playoffs

	} // end of if in season

	// if football is not in season (not started yet), so just skip, do nothing
	else {
		console.log("football not in season");
		complete();
	}

// define football complete function which after scraping calls python script to add matchup data
var football_complete = function() {

	// iterate over how many times (# of matchups) have been scraped
	football_iterate_complete += 1;

	// if all the matchups available have been scraped
	if (football_iterate_complete === football_completed_matchups) {
		console.log("football scraping done");

		// set python arguments
		var options = {
			args: [owner_number, year1]
		}		

		// run python script to interpret scraped data and convert to 
		pyshell.run('python/football_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			// tell overall complete that football scraping and processing is done
			complete();

		}) // end of pyshell

	} // end of if statement
	
} // end of football_complete function

// BASKETBALL //

	// initialize counter for basketball_complete function
	var basketball_iterate_complete = 0;

	// if basketball is in season, else skip
	if (basketball_in_season == true) {

		// if completed season is false, need to SCRAPE
		if (basketball_completed_season == false) {

			// clear basketball scrape collection
			db.collection("owner" + owner_number + "_basketball_matchups_scrape_" + year2).remove({})

			// pull owner name and teams associated with owner
			db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
				owner_name = docs[0]["owner"];
				//console.log(owner_name);
				owner_team_list = docs[0]["teams"];
				//console.log(owner_team_list);

				// initialize basketball variables needed for scrape
				var basketball_team1, basketball_team2, basketball_opposing_owner, basketball_my_team, basketball_opposing_team
				var basketball_record1, basketball_record2, basketball_save_record
				//var basketball_matchup_number = 1

				// for however many completed basketball matchups there are
				for (basketball_matchup_number = 1; basketball_matchup_number < basketball_completed_matchups + 1; basketball_matchup_number++) {

					// url for basketball scoreboard
					var url = 'http://games.espn.com/fba/scoreboard?leagueId=100660&seasonId=' + year2 + '&matchupPeriodId=' + basketball_matchup_number;

					request(url, function(error, response, html) {

						// if not an error
						if(!error){

							// use cheerio to traverse and scrape html 
							var $ = cheerio.load(html);

							// iterate through each matchup 5 per week
							$('tr.tableSubHead').each(function(j, element) {

								// initialize the saved record each game
								basketball_save_record = null;

								// find and pull team1 name and record of the matchup
								basketball_team1 = $(this).next().children().children().first();
								//console.log(basketball_team1.text());
								basketball_record1 = $(this).next().children().last().children();
								//console.log(basketball_record1.text());

								// find and pull team2 name and record of the matchup
								basketball_team2 = $(this).next().next().children().children().first();
								//console.log(basketball_team2.text());
								basketball_record2 = $(this).next().next().children().last().children();
								//console.log(basketball_record2.text());

								// if team1 is in list of owner's teams
								if (owner_team_list.indexOf(basketball_team1.text()) != -1) {

									// set team names
									basketball_my_team = basketball_team1.text();
									basketball_opposing_team = basketball_team2.text();

									while (basketball_opposing_team.indexOf(".") != -1) {
										basketball_opposing_team = football_opposing_team.replace(".", "\\uff0E");
									}									
									//console.log(basketball_my_team);
									//console.log(basketball_opposing_team);

									// set record of matchup
									basketball_save_record = basketball_record1.text();
									//console.log(basketball_save_record);

									// pull opposing owner's name per team name
									basketball_opposing_owner = owners_per_team_name_list["teams"][basketball_opposing_team]["owner"]
									//console.log(opposing_owner);

								}

								// if team2 is in list of owner's teams
								else if (owner_team_list.indexOf(basketball_team2.text()) != -1) {

									// set team names
									basketball_my_team = basketball_team2.text();
									basketball_opposing_team = basketball_team1.text();

									while (basketball_opposing_team.indexOf(".") != -1) {
										basketball_opposing_team = football_opposing_team.replace(".", "\\uff0E");
									}									
									//console.log(basketball_my_team);
									//console.log(basketball_opposing_team);

									// set record of matchup
									basketball_save_record = basketball_record2.text();
									//console.log(basketball_ave_record);

									// pull opposing owner's name per team name
									basketball_opposing_owner = owners_per_team_name_list["teams"][basketball_opposing_team]["owner"]
									//console.log(basketball_opposing_owner);

								}

								// if there is a saved record, then this is the matchup we want and upload to mongdb
								if (basketball_save_record != null) {
									// add to basketball scrape collection
									db.collection('owner' + owner_number + "_basketball_matchups_scrape_" + year2).insert({"opposing_owner": basketball_opposing_owner, "record": basketball_save_record})

									// call basketball_complete to see if all matchups are complete
									basketball_complete();
								}
								
							}) // end of table.ptsBased.matchup iteration
						} // end of if(!error)
					}) // end of request
				} // end of for loop

			}) // end of owner team collection

		} // end of if playoffs

		// if season is complete
		else {
			console.log("basketball already done");

			// tell overall complete function that basketball scrape and processing is already done
			complete();
		} // end of else if playoffs
	} // end of if season

	// if not in season, skip
	else {
		console.log("basketball not in season");
		complete();
	}

// define function that once all matchups are complete, uses python script for processing
var basketball_complete = function() {

	// each time function called, iterate by one
	basketball_iterate_complete += 1;

	// if times all matchups completed
	if (basketball_iterate_complete === basketball_completed_matchups) {
		console.log("basketball scraping done");

		// set python arguments
		var options = {
			args: [owner_number, year2]
		}

		// call basketball matchups python script to processing
		pyshell.run('python/basketball_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			// tell overall complete function that basketball scrape and processing is already done
			complete();
		}) // end of pyshell
	} // end of if statement
} // end of complete function


// BASEBALL //

	// initialize count for baseball_complete function
	var baseball_iterate_complete = 0;

	// if baseball is in season, else skip
	if (baseball_in_season == true) {

		// if season is completed, no need to scrape
		if (baseball_completed_season == false) {

			// remove baseball scrape collection
			db.collection("owner" + owner_number + "_baseball_matchups_scrape_" + year2).remove({})

			// pull team list per owner
			db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
				owner_name = docs[0]["owner"];
				//console.log(owner_name);
				owner_team_list = docs[0]["teams"];
				//console.log(owner_team_list);

				// initialize baseball scrape variables
				var baseball_team1, baseball_team2, baseball_opposing_owner, baseball_my_team, baseball_opposing_team
				var baseball_record1, baseball_record2, baseball_save_record
				//var baseball_matchup_number = 1

				// for however many matchups have been completed
				for (baseball_matchup_number = 1; baseball_matchup_number < baseball_completed_matchups + 1; baseball_matchup_number++) {

					// baseball scoreboard url
					var url = 'http://games.espn.com/flb/scoreboard?leagueId=109364&seasonId=' + year2 + '&matchupPeriodId=' + baseball_matchup_number;

					request(url, function(error, response, html) {

						// if not an error
						if(!error){

							// use cheerio to traverse and scrape html 
							var $ = cheerio.load(html);

							// per each matchup (5 per week)
							$('tr.tableSubHead').each(function(j, element) {

								// initialize saved record each loop
								baseball_save_record = null;

								// traverse and pull team1 name and record
								baseball_team1 = $(this).next().children().children().first();
								//console.log(baseball_team1.text());
								baseball_record1 = $(this).next().children().last().children();
								//console.log(baseball_record1.text());

								// traverse and pull team2 name and record
								baseball_team2 = $(this).next().next().children().children().first();
								//console.log(baseball_team2.text());
								baseball_record2 = $(this).next().next().children().last().children();
								//console.log(baseball_record2.text());

								// if team1 is in owner team names list
								if (owner_team_list.indexOf(baseball_team1.text()) != -1) {

									// set team names
									baseball_my_team = baseball_team1.text();
									baseball_opposing_team = baseball_team2.text();

									while (baseball_opposing_team.indexOf(".") != -1) {
										baseball_opposing_team = football_opposing_team.replace(".", "\\uff0E");
									}									
									//console.log(baseball_my_team);
									//console.log(baseball_opposing_team);

									// set and save record
									baseball_save_record = baseball_record1.text();
									//console.log(baseball_save_record);

									// find and pull opposing owner from opposing team name
									baseball_opposing_owner = owners_per_team_name_list["teams"][baseball_opposing_team]["owner"]
									//console.log(baseball_opposing_owner);

								}

								// if team2 is in owner team names list
								else if (owner_team_list.indexOf(baseball_team2.text()) != -1) {

									// set team names
									baseball_my_team = baseball_team2.text();
									baseball_opposing_team = baseball_team1.text();

									while (baseball_opposing_team.indexOf(".") != -1) {
										baseball_opposing_team = football_opposing_team.replace(".", "\\uff0E");
									}									
									//console.log(baseball_my_team);
									//console.log(baseball_opposing_team);

									// set and save record
									baseball_save_record = baseball_record2.text();
									//console.log(baseball_save_record);

									// find and pull opposing owner from opposing team name
									baseball_opposing_owner = owners_per_team_name_list["teams"][baseball_opposing_team]["owner"]
									//console.log(baseball_opposing_owner);

								}

								// if record is set, then this is the matchup we want
								if (baseball_save_record != null) {

									// insert applicable data to scrape collection
									db.collection('owner' + owner_number + "_baseball_matchups_scrape_" + year2).insert({"opposing_owner": baseball_opposing_owner, "record": baseball_save_record})

									// tell baseball_complete this week is done
									baseball_complete();
								}
								
							}) // end of table.ptsBased.matchup iteration
						} // end of if(!error)
					}) // end of request
				} // end of for loop

			}) // end of owner team collection

		} // end of if playoffs

		// if season is complete, don't need to scrape or process
		else {
			console.log("baseball already done");

			// tell overall complete baseball is scraped and processed
			complete();
		} // end of else if playoffs
	} // end of if season

	// if not in season, skip
	else {
		console.log("baseball not in season");
		complete();
	}

// define baseball_complete function
var baseball_complete = function() {

	// each time after successful upload, iterate
	baseball_iterate_complete += 1;

	// if all available matchups are complete, 
	if (baseball_iterate_complete === baseball_completed_matchups) {
		console.log("baseball scraping done");

		// set python arguments
		var options = {
			args: [owner_number, year2]
		}

		// run python script that processes record
		pyshell.run('python/baseball_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			// tell overall complete function that baseball is scraped and processes
			complete();
		}) // end of pyshell
	} // end of if statement
} // end of complete function

} // end of owner_matchups