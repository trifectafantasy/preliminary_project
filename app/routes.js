///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');
var forEach = require('async-foreach').forEach;

var mongo = require('mongodb');
var assert = require('assert');
var math = require('mathjs');

// create router object
var router = express.Router();
// export router to server.js file
module.exports = router;

// Create MongoClient using collection espn
var MongoClient = mongo.MongoClient;
var mongo_url = 'mongodb://localhost:27017/espn';
var db;

// Initialize connection once
MongoClient.connect("mongodb://localhost:27017/espn", function(err, database) {
  
  if(err) throw err;

  // use database callback to set db
  db = database;
  console.log("Connected to MongoDB")

});


// set years of current trifecta season to test against
var current_year1 = 2016;
var current_year2 = 2017;

// year of most recent completed (in the past) season
var completed_football_season = 2016;
var completed_basketball_season = 2016;
var completed_baseball_season = 2016;


// Route to Home/Root page
router.get('/', function(req, res) {

	res.render('index', {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	});

});

// route to baseball acquisition values given either hitters or pitchers
router.get('/owner/:owner_number/:sport/acquisitions/:year/:hit_or_pit', function(req, res) {

	// set variables from request url
	var sport = req.params.sport;
	var year = req.params.year;
	var owner_number = req.params.owner_number;
	var hit_or_pit = req.params.owner_number;

	// make sure sport is baseball
	if (sport === 'baseball') {

		// scrape active stats
		var active_stats = require('./baseball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call1) {
			console.log("active stats scrape done");

			// scrape PRs
			var pr_scrape = require('./baseball_acquisitions_pr.js')(req, res, db, sport, year, owner_number, function(err, call2) {
				console.log("pr srape done");

				// scrape additions
				var baseball_add = require('./baseball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
					console.log("added players done");

					// scrape drafted
					var baseball_draft = require('./draft.js')(req, res, db, sport, year, owner_number, function(err, call4) {
						console.log("drafted players done");

						var options = {
							args: [sport, year, owner_number]
						}

						// create acquisition values
						pyshell.run('baseball_acquisitions.py', options, function(err) {
							console.log("python script done");


						}) // end of pyshell						
					}) // end of drafted
				}) // end of added
			}) // end of pr scrape
		}) // end of active stats scrape
	}

}) // end of router get for baseball acquisitions

// route to football and basketball acquistion values
router.get('/owner/:owner_number/:sport/acquisitions/:year', function(req, res) {

	// set variables from request url
	var sport = req.params.sport;
	var year = req.params.year;
	var owner_number = req.params.owner_number

	// if sport is football
	if (sport == 'football') {

		// if owner is all
		if (owner_number == 'all') {

			var owners = 'all';

			// send to script that compiles all owners' acquisitions
			var football_all = require('./all_acquisitions.js')(req, res, db, sport, year, function(err, call){
				console.log("update complete");

				// pull database for display
				db.collection(sport + "_acquisitions_" + year + "_all").find({}, {"_id": 0}, {"sort": [["acquisition_value", "desc"], ["acquisition_weight", "asc"]]}).toArray(function(e, docs) {
					//console.log(docs);
					console.log("displaying all acquisition stats...");
					disp_acquisitions = docs;

					// loop from back to front of pulled array
					for (i = disp_acquisitions.length - 1; i >= 0; i--) {

						var move_back = "";

						// if player is from a trade, move to back
						if (disp_acquisitions[i]["acquired"] == "Trade") {

							// set moved element
							move_back = disp_acquisitions[i];

							// remove this indexed element
							disp_acquisitions.splice(i, 1);

							// add moved element to back
							disp_acquisitions.push(move_back);

						}

					} // end of for loop for sorting

					res.render('football_acquisitions', {
						year: year,
						acquisitions: disp_acquisitions,
						owners: owners
					})
				}) // end of collection pull for display
			}) // end of script for all acquisitions
		} // end of all owners

		// if owner is a specific owner
		else {
			
			// send to script that pulls active stats
			var active_stats = require('./football_active_stats.js')(req, res, db, sport, year, owner_number, function(err, football_owner_number) {
				console.log("active stats scrape done");

				// send to script that adds added players
				var add_acquisitions = require('./football_add.js')(req, res, db, sport, year, owner_number, function(err, call) {
					console.log("added players done");

					// send to script that adds drafted players
					var trade_acquisition = require('./draft.js')(req, res, db, sport, year, owner_number, function(err, call2) {
						console.log("drafted players done");

						var options = {
							args: [sport, year, owner_number]
						}

						// python script that determines acqusition value
						pyshell.run('football_acquisitions.py', options, function(err) {
							console.log("acquisition python script complete");

							// pull owner acquisition database for display
							db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).find({}, {"_id": 0}, {"sort": [["acquisition_value", "desc"], ["PTS", "desc"], ["acquisition_weight", "asc"]]}).toArray(function(e, docs) {
								//console.log(docs);
								console.log("displaying acquisition stats...");
								disp_acquisitions = docs;

								// loop from back to front of pulled array
								for (i = disp_acquisitions.length - 1; i >= 0; i--) {

									var move_back = "";

									// if player is from a trade, move to back
									if (disp_acquisitions[i]["acquired"] == "Trade") {

										// set moved element
										move_back = disp_acquisitions[i];

										// remove this indexed element
										disp_acquisitions.splice(i, 1);

										// add moved element to back
										disp_acquisitions.push(move_back);

									}

								}							

								// pull owner nanme for pug display
								db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs2) {

									owner_name = docs2[0]["owner"];

									res.render('football_acquisitions', {
										year: year,
										owner: owner_name,
										acquisitions: disp_acquisitions

									})
								}) // end of owner database find
							}) // end of acquisition find for display
						}) // end of python script
					}) // end of football draft script
				}) // end of football add script
			})	// end of active stats script
		} // end of else for specific owner
	} // end of if football

	else if (sport == 'basketball') {


		if (owner_number == 'all') {
			var owners = "all";

			// send to script that compiles all owners' acquisitions
			var football_all = require('./all_acquisitions.js')(req, res, db, sport, year, function(err, call){
				console.log("update complete");

				// pull database for display
				db.collection(sport + "_acquisitions_" + year + "_all").find({}, {"_id": 0}, {"sort": [["acquisition_value", "desc"], ["weighted_PR", "desc"], ["acquisition_weight", "asc"]]}).toArray(function(e, docs) {
					//console.log(docs);
					console.log("displaying all acquisition stats...");
					disp_acquisitions = docs;

					// loop from back to front of pulled array
					for (i = disp_acquisitions.length - 1; i >= 0; i--) {

						var move_back = "";

						// if player is from a trade, move to back
						if (disp_acquisitions[i]["acquired"] == "Trade") {

							// set moved element
							move_back = disp_acquisitions[i];

							// remove this indexed element
							disp_acquisitions.splice(i, 1);

							// add moved element to back
							disp_acquisitions.push(move_back);

						}
					} // end of for loop for sorting

					res.render('basketball_acquisitions', {
						year: year,
						acquisitions: disp_acquisitions,
						owners: owners
					})
				}) // end of collection pull for display
			}) // end of script for all acquisitions
		} // end of all owners			

		else {
			var active_stats = require('./basketball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
				console.log("active stats scrape done");

				var pr_scrape = require('./basketball_acquisitions_pr.js')(req, res, db, sport, year, owner_number, function(err, call2) {
					console.log("PR scrape done");

					var basketball_add = require('./basketball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
						console.log("added players done");

						var basketball_draft = require('./draft.js')(req, res, db, sport, year, owner_number, function(err, call4) {
							console.log("drafted players done");

							var options = {
								args: [sport, year, owner_number]
							}

							pyshell.run('basketball_acquisitions.py', options, function(err) {

								db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).find({}, {"_id": 0}, {"sort": [["acquisition_value", "desc"], ["weighted_PR", "desc"], ["acquisition_weight", "asc"]]}).toArray(function(e, docs) {
									//console.log(docs);
									console.log("displaying acquisition stats...");
									disp_acquisitions = docs;

									// loop from back to front of pulled array
									for (i = disp_acquisitions.length - 1; i >= 0; i--) {

										var move_back = "";

										// if player is from a trade, move to back
										if (disp_acquisitions[i]["acquired"] == "Trade") {

											// set moved element
											move_back = disp_acquisitions[i];

											// remove this indexed element
											disp_acquisitions.splice(i, 1);

											// add moved element to back
											disp_acquisitions.push(move_back);

										}

									} // end of for loop for sorting								

									// pull owner nanme for pug display
									db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs2) {

										owner_name = docs2[0]["owner"]

										res.render('basketball_acquisitions', {
											year: year,
											owner: owner_name,
											acquisitions: disp_acquisitions

										})
									}) // end of owner database find
								}) // end of acquisition find for display							
							}) // end of pyshell
						}) // end of basketball draft
					}) // end of basketball add
				}) // end of pr scrape
			}) // end of active stats scrape
		} 
	} // end of if basketball
	
}) // end of route to football and basketball acquisition stats

// route to trifecta standings
router.get('/trifecta_standings/:year1/:year2', function(req, res) {
	
	// set variables from request URL
	var year1 = req.params.year1;
	var year2 = req.params.year2;
	var year_diff = year2 - year1;

	// initialize display variable
	var disp_trifecta_standings = null;

	// handle error case of non consecutive years
	if (year_diff != 1) {
		res.send("Please enter two consecutive years")
	}

	// if pass first error handle
	else {
		// if the given years are the current ones, set appropriate parameters
		if (year1 == current_year1 && year2 == current_year2) {
			
			// set variables
			var football_in_season = true;
			var basketball_in_season = true;
			var baseball_in_season = false;

			// set input arguments for python script
			var options = {
				args: [year1, year2, football_in_season, basketball_in_season, baseball_in_season]
			}

			var disp_trifecta_standings = null;

			// always run trifecta standings python script
			pyshell.run('trifecta_standings.py', options, function(err) {
				if (err) throw err;
				console.log("Trifecta standings python script complete");
				
				// pull from this seasons trifecta collection
				db.collection('trifecta_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs){
					//console.log(docs);
					console.log("Displaying trifecta season standings...");
					disp_trifecta_standings = docs;

					// render to standings_playoffs
					res.render('trifecta_season', {
						year1: year1,
						year2: year2,
						trifecta_standings: disp_trifecta_standings,
					});
				});
			});			
		}

		// if the years given are in the past, set everything as finished (true, max, true)
		else if (year1 < current_year1 && year2 < current_year2) {
			// football variables
			var football_in_season = true;
			var basketball_in_season = true;
			var baseball_in_season = true;
			
			// pull from  trifecta season collection and sort by total trifecta points
			db.collection('trifecta_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying trifecta season data...")
				disp_trifecta_standings = docs;
				// render to trifecta_season.pug
				res.render('trifecta_season', {
					year1: year1,
					year2: year2,
					trifecta_standings: disp_trifecta_standings
				})
			})
		}
		// handle error case if years are greater than current
		else {
			var disp_err = "Please enter years " + current_year1 + " & " + current_year2 + " or less";
			res.send(disp_err);
		}
	} // end of first error handling	

}); // end of trifecta_standings route


// route to /football_standings
router.get('/football_standings/:year', function(req, res) {

	// set parameters for requested season
	var year = req.params.year;
	var playoffs = true;

	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_trifecta_standings = null;	

	// if requested season is already completed
	if (year <= completed_football_season) {

		// if season is in past, playoffs are always true
		playoffs = true;

		// pull from mongodb and display new data after python script finishes
		db.collection('football_h2h_' + year).find({}, {"_id": 0}).sort({"trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying h2h data...")
			disp_h2h_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		// if playoffs are finished, 
		if (playoffs === true) {
			// set year as input argument for python script
			var options = {
				args: [year]
			};

			// async function to count number of documents in football trifecta database
			db.collection('football_trifecta_' + year).count({}, function(err, num){

				// if trifecta database is filled (already 10 documents)
				if (num === 10) {

					// pull down trifecta standings in order of total trifecta points
					db.collection('football_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
						//console.log(docs);
						console.log("Displaying playoff data...");
						disp_trifecta_standings = docs;
						complete();
					});				
				}
				else {
					// if trifecta database is not filled, run python script that adds playoff points to regular season points and creates trifecta database
					pyshell.run('football_playoffs.py', options, function(err) {

						if (err) throw err;
						console.log('Playoff python script complete');

						db.collection('football_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
							//console.log(docs);
							console.log("Displaying playoff data...");
							disp_trifecta_standings = docs;
							complete();
						});				
					})
				}
			})
		};

		// function that checks if both finds from mongodb are complete (ie display variables are not empty)
		var complete = function() {

			if (playoffs === true) {
				if (disp_h2h_standings !== null && disp_trifecta_standings !== null) {

					// render to standings_playoffs
					res.render('football_standings', {
						h2h_standings: disp_h2h_standings,
						trifecta_standings: disp_trifecta_standings,
						year: year,
						playoffs: playoffs
					});
				}			
			}
			else {
				if (disp_h2h_standings !== null) {

					// render to standings
					res.render('football_standings', {
						h2h_standings: disp_h2h_standings,
						year: year,
						playoffs: playoffs
					});
				}			
			}
		}		
	} // end of if <= 2016 (aka, don't need to srape anymore)

	// if this current and in season, scrape
	else {
			var stand = require('./football_standings_router_template.js')(req, res, db, year, playoffs);
	}

}); // end of .get('/foottball_standings')


// route to /basketball_standings
router.get('/basketball_standings/:year', function(req, res) {
	
	// set parameters for requested basketball season
	var year = req.params.year;
	var playoffs = false;

	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_roto_standings = null;
	var disp_trifecta_standings = null;

	// if season is in the past, just display
	if (year <= completed_basketball_season) {

		// if season is in past, playoffs are always true
		playoffs = true;

		// pull from mongodb and display new data after python script finishes
		db.collection('basketball_h2h_' + year).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying h2h data...")
			disp_h2h_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		db.collection('basketball_roto_' + year).find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying roto data...")
			disp_roto_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		// if playoffs are completed
		if (playoffs === true) {
			// initialize year as argument for python script
			var options = {
				args: [year]
			};

			// see if trifecta database is complete (10 documents)
			db.collection('basketball_trifecta_' + year).count({}, function(err, num) {

				// if complete, pull trifeta database and sort by total trifecta points
				if (num === 10) {
						db.collection('basketball_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
							//console.log(docs);
							console.log("Displaying playoff data...");
							disp_trifecta_standings = docs;
							complete();
						});				
				}
				else {
					// if database not complete, fun python script to initialize trifecta database
					pyshell.run('basketball_playoffs.py', options, function(err) {
						if (err) throw err;
						console.log('Playoff python script complete');

						db.collection('basketball_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
							//console.log(docs);
							console.log("Displaying playoff data...");
							disp_trifecta_standings = docs;
							complete();
						});				
					})
				}
			})
		};

		// function that checks if both finds from mongodb are complete (ie display variables are not empty)
		var complete = function() {

			if (playoffs === true) {
				if ((disp_h2h_standings !== null && disp_roto_standings !== null) && disp_trifecta_standings !== null) {

					// render to baseball_standings
					res.render('basketball_standings', {
						h2h_standings: disp_h2h_standings,
						roto_standings: disp_roto_standings,
						trifecta_standings: disp_trifecta_standings,
						year: year,
						playoffs: playoffs
					});
				}
			}
			else {
				if (disp_h2h_standings !== null && disp_roto_standings !== null) {

					// render to baseball_standings
					res.render('basketball_standings', {
						h2h_standings: disp_h2h_standings,
						roto_standings: disp_roto_standings,
						year: year,
						playoffs: playoffs
					});
				}
			}
		} // end of complete function
	}

	else {
		var stand = require('./basketball_standings_router_template.js')(req, res, db, year, playoffs);
	}	

}); // end of .get('/basketball_standings')


// route to /baseball_standings
router.get('/baseball_standings/:year', function(req, res) {
	
	// set parameters for requested year
	var year = req.params.year;
	var playoffs = false;

	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_roto_standings = null;
	var disp_trifecta_standings = null;

	// if this season is in the past, just display
	if (year <= completed_baseball_season) {

		// if season is in past, playoffs are always true
		playoffs = true;		

		// pull from mongodb and display new data after python script finishes
		db.collection('baseball_h2h_' + year).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying h2h data...")
			disp_h2h_standings = docs;
			// call complete to see if both finds are done
			complete();
		});

		db.collection('baseball_roto_' + year).find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
			//console.log(docs);
			console.log("Displaying roto data...")
			disp_roto_standings = docs;
			// call complete to see if both finds are done
			complete();
		});				

		// if playoffs have been completed
		if (playoffs === true) {
			// set year as arguments for python script
			var options = {
				args: [year]
			};

			// count number in trifecta database
			db.collection('baseball_trifecta_' + year).count({}, function(err, num) {

				// if there are 10 documents in trifecta database, just read trifecta database and sort by total trifecta points
				if (num === 10) {
						db.collection('baseball_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
							//console.log(docs);
							console.log("Displaying playoff data...");
							disp_trifecta_standings = docs;
							complete();
						});				
				}
				else {
					// if no trifecta database, run python shell to set it
					pyshell.run('baseball_playoffs.py', options, function(err) {
						if (err) throw err;
						console.log('Playoff python script complete');

						db.collection('baseball_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
							//console.log(docs);
							console.log("Displaying playoff data...");
							disp_trifecta_standings = docs;
							complete();
						});				
					})
				}
			})
		};

		// function that checks if both finds from mongodb are complete (ie display variables are not empty)
		var complete = function() {

			if (playoffs === true) {
				if ((disp_h2h_standings !== null && disp_roto_standings !== null) && disp_trifecta_standings !== null) {

					// render to baseball_standings
					res.render('baseball_standings', {
						h2h_standings: disp_h2h_standings,
						roto_standings: disp_roto_standings,
						trifecta_standings: disp_trifecta_standings,
						year: year,
						playoffs: playoffs
					});
				}			
			}
			else {
				if (disp_h2h_standings !== null && disp_roto_standings !== null) {

					// render to baseball_standings
					res.render('baseball_standings', {
						h2h_standings: disp_h2h_standings,
						roto_standings: disp_roto_standings,
						year: year,
						playoffs: playoffs
					});
				}			
			}
		} // end of complete function
	} 

	// if this is the current season, scrape
	else {
		var stand = require('./baseball_standings_router_template.js')(req, res, db, year, playoffs);
	}		
		
}) // end of .get('/baseball_standings')

// route to home page for all individual owner matchup data
router.get('/owner_matchup_home_page', function(req, res) {
	res.render('owner_matchup_home_page');
})

// route to individual owner's matchups for a given trifecta season
router.get('/owner/:owner_number/matchups/:year1/:year2', function(req, res) {
	
	// pull parameters from request URL
	var owner_number = req.params.owner_number;
	var year1 = req.params.year1;
	var year2 = req.params.year2;
	var year_diff = year2 - year1;

	// handle error case of non consecutive years
	if (year_diff != 1) {
		res.send("Please enter two consecutive years")
	}

	// if pass first error handle
	else {
		// if the given years are the current ones, set appropriate parameters
		if (year1 == current_year1 && year2 == current_year2) {
			
			// football variables
			// if football_in_season is false, skip altogether
			var football_in_season = true;
			// if football_playoffs is true, skip scrape
			var football_playoffs = true;
			// full regular season = 13 matchups
			var football_completed_matchups = 13;

			// basketball variables
			// if basketball_in_season is false, skip altogether
			var basketball_in_season = true;
			// if basketball_playoffs is true, skip scrape
			var basketball_playoffs = false;
			// full regular season = 18 matchups
			var basketball_completed_matchups = 14;	

			// baseball variables
			// if baseball_in_season is false, skip altogether
			var baseball_in_season = false;
			// if baseball_playoffs is true, skip scrape
			var baseball_playoffs = false;
			// full regular season = 22 matchups
			var baseball_completed_matchups = 1;

			// call matchups.js with all the necessary arguments
			var match = require('./matchups.js')(req, res, db, owner_number, year1, year2, football_in_season, football_completed_matchups, football_playoffs, basketball_in_season, basketball_completed_matchups, basketball_playoffs, baseball_in_season, baseball_completed_matchups, baseball_playoffs);
		}
		// if the years given are in the past, set everything as finished (true, max, true)
		else if (year1 < current_year1 && year2 < current_year2) {
			
			// football variables
			// if football_in_season is false, skip altogether
			var football_in_season = true;
			// if football_playoffs is true, skip scrape
			var football_playoffs = true;
			// full regular season = 13 matchups
			var football_completed_matchups = 13;

			// basketball variables
			// if basketball_in_season is false, skip altogether
			var basketball_in_season = true;
			// if basketball_playoffs is true, skip scrape
			var basketball_playoffs = true;
			// full regular season = 18 matchups
			var basketball_completed_matchups = 18;	

			// baseball variables
			// if baseball_in_season is false, skip altogether
			var baseball_in_season = true;
			// if baseball_playoffs is true, skip scrape
			var baseball_playoffs = true;
			// full regular season = 22 matchups
			var baseball_completed_matchups = 22;
				
			var match = require('./matchups.js')(req, res, db, owner_number, year1, year2, football_in_season, football_completed_matchups, football_playoffs, basketball_in_season, basketball_completed_matchups, basketball_playoffs, baseball_in_season, baseball_completed_matchups, baseball_playoffs);
		}
		// handle error case if years are greater than current
		else {
			var disp_err = "Please enter years " + current_year1 + " & " + current_year2 + " or less";
			res.send(disp_err);
		}
	}

}); // end of owner to owner matchups 


// route to individual owner's matchups for a given trifecta season
router.get('/owner/:owner_number/matchups/all', function(req, res) {
	
	// pull parameters from request URL
	var owner_number = req.params.owner_number;

	var football_in_season = false;
	var basketball_in_season = true;
	var baseball_in_season = false;

	var disp_football_matchups = null;
	var disp_basketball_matchups = null;
	var disp_baseball_matchups = null;
	var disp_trifecta_matchups = null;

	var options = {
		args: [owner_number, completed_football_season, football_in_season, completed_basketball_season, basketball_in_season, completed_baseball_season, baseball_in_season]
	}	

	db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"]
		//console.log(owner_name);

		pyshell.run('total_owner_matchups.py', options, function(err) {
			if (err) throw err;
			console.log("total matchups python script complete");


			db.collection('owner' + owner_number + '_football_matchups_all').find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling football data...');
				disp_football_matchups = docs;
				complete();
			})

			db.collection('owner' + owner_number + '_basketball_matchups_all').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling basketball data...');
				disp_basketball_matchups = docs;
				complete();

			})

			db.collection('owner' + owner_number + '_baseball_matchups_all').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling baseball data...');
				disp_baseball_matchups = docs;
				complete();
			})

			db.collection('owner' + owner_number + '_trifecta_matchups_all').find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log('pulling trifecta data...');
				disp_trifecta_matchups = docs;
				complete();
			})		

		}) // end of total owner python script
	});

	var complete = function() {

		if ((disp_football_matchups !== null && disp_basketball_matchups !== null) && (disp_baseball_matchups !== null && disp_trifecta_matchups !== null)) {

			res.render('total_owner_matchups', {
				owner: owner_name,
				football_matchups: disp_football_matchups,
				basketball_matchups: disp_basketball_matchups,
				baseball_matchups: disp_baseball_matchups,
				trifecta_matchups: disp_trifecta_matchups
			})
		}
	}


}); // end of owner to owner matchups 

router.get('/:sport/trades/:year', function(req, res) {

	// set variables from request url
	var sport = req.params.sport;
	var year = req.params.year;

	// set completed season for check if in season or not depending on sport
	if (sport === 'football') {
		completed_sport_season = completed_football_season;
	}
	else if (sport === 'basketball') {
		completed_sport_season = completed_basketball_season;
	}
	else if (sport === 'baseball') {
		completed_sport_season = completed_baseball_season;
	}

	// if year is greater than the last completed one (aka, in season)
	if (year > completed_sport_season) {

		// send to trade.js for transactional trades scrape
		var trade = require('./trade.js')(req, res, db, sport, year, function(err, owner_number_list, trades_processed, players_processed) {
		// return callback variables owner_number_list, trades_processed, and players_processed

			// remove duplicate owner numbers so only scrape each owner who made a trade once
			owner_number_list = owner_number_list.filter(function(item, index, inputArray) {
				return inputArray.indexOf(item) == index;
			})
			//console.log("new owner numbers: ", owner_number_list);

			console.log("trades processed: ", trades_processed)
			console.log("players processed: ", players_processed)

			// if sport is football
			if (sport === 'football') {

				// send to football_trade_stats to scrape active stats for players in trades
				var trade_stats = require('./football_trade_stats.js')(req, res, db, sport, year, owner_number_list, function(err, call) {
					console.log("scrape done");

					var options = {
						args: [sport, year]
					}

					// run python script to associate traded players with their active stats and sum to make total 
					pyshell.run('football_trade_analysis.py', options, function(err) {
						if (err) throw err;
						console.log('trade python script complete');

						// sort and pull from trade database for rendering
						db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"], ["PTS", "asc"]]}).toArray(function(e, docs) {
							console.log('displaying trade analysis...');
							//console.log(docs);
							disp_trade = docs;
							res.render('football_trade', {
								year: year,
								trader: disp_trade,
							})
						})
					})
				}) 					
			}

			// if sport is basketball
			else if (sport === 'basketball') {

				// send to basketball_trade_stats to scrape active stats for players in trade
				var trade_stats = require('./basketball_trade_stats.js')(req, res, db, sport, year, owner_number_list, function(err, call) {
					console.log("scrape done");

					var options = {
						args: [sport, year]
					}

					// run python sript to associate traded players with their active stats and sum to make total
					pyshell.run('basketball_trade_analysis.py', options, function(err) {
						if (err) throw err;
						console.log('trade python script complete');

						// sort and pull from trade database for rendering
						db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"], ["GP", "asc"]]}).toArray(function(e, docs) {
							console.log('displaying trade analysis...');
							//console.log(docs);
							disp_trade = docs;
							res.render('basketball_trade', {
								year: year,
								trader: disp_trade
							})
						})

					})

				}) 			
			}

			// if sport is baseball
			else if (sport === 'baseball') {
				var trade_stats = require('./baseball_trade_stats.js')(req, res, db, sport, year, owner_number_list, function(err, call) {
					console.log("scrape done");

					var options = {
						args: [sport, year]
					}

					// run python script to associate traded players with their active stats and sum to make total
					pyshell.run('baseball_trade_analysis.py', options, function(err) {
						if (err) throw err;
						console.log('trade python script complete');

						// sort and pull from trade database for rendering
						db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"]]}).toArray(function(e, docs) {
							console.log('displaying trade analysis...');
							//console.log(docs);
							disp_trade = docs;
							res.render('baseball_trade', {
								year: year,
								trader: disp_trade,
							})
						})
					})
					
				})
			}

		});
	}

	// if sport want trade analysis for was in the past, skip scrape
	else {

		// if sport is football
		if (sport === 'football') {

			// and unscrabable football 2015
			if (year === '2015') {
				res.send("Sorry, but trade analysis unavailable for Football 2015")
			}

			else {

				// sort and pull from trade database for rendering
				db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"], ["PTS", "asc"]]}).toArray(function(e, docs) {
					console.log('displaying trade analysis...');
					//console.log(docs);
					disp_trade = docs;
					res.render('football_trade', {
						year: year,
						trader: disp_trade,
					})
				})
			}
	
		}

		// if sport is basketball
		else if (sport === 'basketball') {

			// and there are no trades in 2016
			if (year === '2016') {
				res.send("Welp. No trades were made in Basketball 2016")
			}

			else {

				// sort and pull from trade database for rendering
				db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"], ["GP", "asc"]]}).toArray(function(e, docs) {
					console.log('displaying trade analysis...');
					//console.log(docs);
					disp_trade = docs;
					res.render('basketball_trade', {
						year: year,
						trader: disp_trade
					})
				})				
			}
	
		}
		else if (sport === 'baseball') {

			// sort and pull from trade database for rendering
			db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"]]}).toArray(function(e, docs) {
				console.log('displaying trade analysis...');
				//console.log(docs);
				disp_trade = docs;
				res.render('baseball_trade', {
					year: year,
					trader: disp_trade,
				})
			})			
		}
	}

});
