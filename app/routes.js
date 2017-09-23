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

// year of most recent totally completed (in the past) season
var completed_football_season = 2016;
var completed_basketball_season = 2017;
var completed_baseball_season = 2016;

// football status variables
var this_football_season_started = true;
var this_football_completed_season = true;
// full regular season = 13 matchups
var football_completed_matchups = 13;

// basktball status variables
var this_basketball_season_started = true;
//set to false if want to stop scraping roto standings after regular season has ended
var this_basketball_in_season = false;
var this_basketball_completed_season = true;
// full regular season = 18 matchups
var basketball_completed_matchups = 18;	

// baseball status variables
var this_baseball_season_started = true;
//set to false if want to stop scraping roto standings after regular season has ended
var this_baseball_in_season = false;
var this_baseball_completed_season = false;
// full regular season = 22 matchups
var baseball_completed_matchups = 22;


// exception built in for when Football in new Trifecta season starts during Baseball in previous Trifecta season
var football_ahead = true;
var football_ahead_current_year = 2017;
var football_ahead_completed_matchups = 2;


// Route to Home/Root page
router.get('/', function(req, res) {
	res.render('index', {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	});
});

// route to future draft boards home page
router.get('/future_draft_boards_home_page', function(req, res) {
	res.render('future_draft_boards_home_page');
}); 

// route to future draft boards
router.get('/future_draft_board/:sport/:year', function(req, res) {
	var sport = req.params.sport;
	var year = req.params.year;

	if (year > current_year2 + 1) {
		res.send("Too far in advance, enter an earlier season. Can only go one year ahead of current sport.");
	}

	else if (year > current_year1 + 1 && sport == "football") {
		res.send("Too far in advance, enter an earlier season. Can only go one year ahead of current sport.");
	}

	else {
		set_board_sport = "football";
		if (sport == set_board_sport) {
			set_board = true;
		}
		else {
			set_board = false;
		}

		var disp_draft_board = null;
		var disp_by_team_draft_board = null;

		db.collection(sport + "_draft_board_" + year).find({"draft_board": "overall"}, {"draft_board": 0, "_id": 0}).sort({"round_number": 1}).toArray(function(e, docs){
			disp_draft_board = docs;
			//console.log(disp_draft_board);
			complete();
		})

		db.collection(sport + "_draft_board_" + year).find({"draft_board": "team"}, {"draft_board": 0, "_id": 0}).toArray(function(e, docs){
			disp_by_team_draft_board = docs;
			//console.log(disp_by_team_draft_board);
			complete();
		})
	}

var complete = function() {

	if (disp_draft_board != null && disp_by_team_draft_board != null) {
		console.log("displaying draft board...");
		res.render('future_draft_boards', {
			sport: sport,
			year: year,
			draft_board: disp_draft_board,
			by_team_draft_board: disp_by_team_draft_board,
			set_board: set_board
		})
	}
}
}) // end of route to future draft boards home page

// route to profile home page
router.get('/profile_home_page', function(req, res) {
	res.render('profile_home_page');
});

// route to individual owner profiles
router.get('/owner/:owner_number/profile/recap', function(req, res) {
	var owner_number = req.params.owner_number;

	// define years in scope
	var start_year = 2015;
	var end_year = current_year2;

	// per this trifecta season, if true, season complete and can pull finished season stats, if false, skip

	var disp_profile_standings = null;
	var disp_profile_matchups = null;
	var disp_profile_players = null;

	// pull owner name
	db.collection('owner' + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"]
		//console.log(owner_name);

		var options = {
			args: [owner_number, start_year, end_year, this_football_completed_season, this_basketball_completed_season, this_baseball_completed_season]
		}

		// python script that calculates each owner's record that season
		pyshell.run('profile_standings.py', options, function(err) {
			console.log("profile standings python script done");

			// pull for display
			db.collection("owner" + owner_number + "_profile_standings").find({}, {"_id": 0}).toArray(function(e, docs2) {
				//console.log(docs2);
				disp_profile_standings = docs2;
				complete();
			}) // end of pull for display
		}) // end of pyshell

		// python script that pulls each owner's best and worst matchups records 
		pyshell.run('profile_matchups.py', options, function(err) {
			console.log('profile matchups python script done');

			// pull for display
			db.collection("owner" + owner_number + "_profile_matchups").find({}, {"_id": 0}).toArray(function(e, docs3) {
				disp_profile_matchups = docs3;
				complete();
			}) // end of pull for display
		}) // end of pyshell

		// python script that pulls each owner's best and worst players from season
		pyshell.run('profile_players.py', options, function(err) {
			console.log('profile players python script done');

			// pull for display
			db.collection('owner' + owner_number + "_profile_players").find({}, {"_id": 0}).toArray(function(e, docs4) {
				disp_profile_players = docs4;
				complete();
			}) // end of pull for display
		}) // ned of pyshell
	}) // end of pull owner name

// complete function that displays tables
var complete = function() {

	// wait for all 3 sets of data to be pulled
	if ((disp_profile_matchups != null && disp_profile_standings != null) && disp_profile_players != null) {
		console.log("displaying profile stats...");
		res.render('profile_recap', {
			owner: owner_name,
			profile_standings: disp_profile_standings,
			matchup_standings: disp_profile_matchups,
			players_standings: disp_profile_players
		})
	} // end of if
} // end of complete function

}); // end of profile season reacap

// route to each owner's trophy case
router.get('/owner/:owner_number/profile/trophy', function(req, res) {
	var owner_number = req.params.owner_number;

	// pull owner name
	db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"];

		// pull owner's trophy case
		db.collection("owner" + owner_number + "_trophies").find({}, {"date": 0, "_id": 0}).sort({"date": 1}).toArray(function(e, docs2) {
			disp_trophies = docs2;
			console.log("displaying trophy case...")

			res.render('trophy_case', {
				owner: owner_name,
				trophies: disp_trophies
			}) // end of render
		}) // end of trophy case pull
	}) // end of owner name pull
}) // end of route to trophy case


// route to home page for each trifecta season's standings (individual sports and trifefcta)
router.get('/standings_home_page/:year1/:year2', function(req, res) {

	var year1 = req.params.year1;
	var year2 = req.params.year2;
	var year_diff = year2 - year1;

	// handle error case of non consecutive years
	if (year_diff != 1) {
		res.send("Please enter two consecutive years")
	}
	else {
		if (year1 < current_year1 && year2 < current_year2) {
			this_football_season_started = true;
			this_basketball_season_started = true;
			this_baseball_season_started = true;
			res.render('full_season_standings_home_page', {
				year1: year1,
				year2: year2,
				football_season_started: this_football_season_started,
				basketball_season_started: this_basketball_season_started,
				baseball_season_started: this_baseball_season_started
			})	// end of res render			
		}

		else if (year1 > current_year1 || year2 > current_year2) {
			if (football_ahead == false) {
				res.send("Enter years " + current_year1 + " & " + current_year2 + " or less")
			}
			else {
				this_football_season_started = true;
				this_basketball_season_started = false;
				this_baseball_season_started = false;
				res.render('full_season_standings_home_page', {
					year1: year1,
					year2: year2,
					football_season_started: this_football_season_started,
					basketball_season_started: this_basketball_season_started,
					baseball_season_started: this_baseball_season_started
				}) // end of res render
			}
		}

		else {
			res.render('full_season_standings_home_page', {
				year1: year1,
				year2: year2,
				football_season_started: this_football_season_started,
				basketball_season_started: this_basketball_season_started,
				baseball_season_started: this_baseball_season_started
			})	// end of res render
		}
	}

}) // end of route to home page for each season's individual sports and trifecta standings

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

			// set input arguments for python script
			var options = {
				args: [year1, year2, this_football_season_started, this_basketball_season_started, this_baseball_season_started]
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

		else {
			// handle error case if years are greater than current
			if (football_ahead == false) {
				var disp_err = "Please enter years " + current_year1 + " & " + current_year2 + " or less";
				res.send(disp_err);
			}
			// handle case when football starts in next trifecta season during baseball in previous trifecta season
			else {
				this_football_season_started = true;
				this_basketball_season_started = false;
				this_baseball_season_started = false;

				// set input arguments for python script
				var options = {
					args: [year1, year2, this_football_season_started, this_basketball_season_started, this_baseball_season_started]
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
	
		}
	} // end of first error handling	

}); // end of trifecta_standings route

// route to /football_standings
router.get('/football_standings/:year', function(req, res) {

	// set parameters for requested season
	var year = req.params.year;

	// set playoffs parameter if football season is ahead
	if (football_ahead == true) {
		var playoffs = false;
	}
	else {
		var playoffs = this_football_completed_season;
	}

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
		}

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

}); // end of .get('/football_standings')


// route to /basketball_standings
router.get('/basketball_standings/:year', function(req, res) {
	
	// set parameters for requested basketball season
	var year = req.params.year;
	var in_season = this_basketball_in_season;
	var playoffs = this_basketball_completed_season;

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

	else if (year > completed_basketball_season && in_season == false) {
		res.send("I'm sorry. Basketball " + year + " is not in season yet.")
	}

	else {
		var stand = require('./basketball_standings_router_template.js')(req, res, db, year, in_season, playoffs);
	}	

}); // end of .get('/basketball_standings')


// route to /baseball_standings
router.get('/baseball_standings/:year', function(req, res) {
	
	// set parameters for requested year
	var year = req.params.year;
	var in_season = this_baseball_in_season;
	var playoffs = this_baseball_completed_season;

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

	else if (year > completed_baseball_season && in_season == false) {
		res.send("I'm sorry. Baseball " + year + " is not in season yet.")
	}	

	// if this is the current season, scrape
	else {
		var stand = require('./baseball_standings_router_template.js')(req, res, db, year, in_season, playoffs);
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

			// if no matchups have been completed yet, it's like the sport isn't in season yet
			if (football_completed_matchups == 0) {
				this_football_season_started = false;
			}

			if (basketball_completed_matchups == 0) {
				this_basketball_season_started = false;
			}

			if (baseball_completed_matchups == 0) {
				this_baseball_season_started = false;
			}
			
			// current year's sports status variables set at ~Line 40

			// if season_started == false or completed_season == true, skip scrape, just display
			// call matchups.js with all the necessary arguments
			var match = require('./matchups.js')(req, res, db, owner_number, year1, year2, this_football_season_started, football_completed_matchups, this_football_completed_season, this_basketball_season_started, basketball_completed_matchups, this_basketball_completed_season, this_baseball_season_started, baseball_completed_matchups, this_baseball_completed_season);
		}
		// if the years given are in the past, set everything as finished (true, max, true)
		else if (year1 < current_year1 && year2 < current_year2) {
			
			// set status variables for past sports //

			// football variables
			this_football_season_started = true;
			this_football_completed_season = true;
			// full regular season = 13 matchups
			football_completed_matchups = 13;

			// basketball variables
			this_basketball_season_started = true;
			this_basketball_completed_season = true;
			// full regular season = 18 matchups
			basketball_completed_matchups = 18;	

			// baseball variables
			this_baseball_season_started = true;
			this_baseball_completed_season = true;
			// full regular season = 22 matchups
			baseball_completed_matchups = 22;

			// if season_started == false or completed_season == true, skip scrape, just display
			// call matchups.js with all the necessary arguments
			var match = require('./matchups.js')(req, res, db, owner_number, year1, year2, this_football_season_started, football_completed_matchups, this_football_completed_season, this_basketball_season_started, basketball_completed_matchups, this_basketball_completed_season, this_baseball_season_started, baseball_completed_matchups, this_baseball_completed_season);
		}
		// handle error case if years are greater than current
		else {
			if (football_ahead == false) {
				var disp_err = "Please enter years " + current_year1 + " & " + current_year2 + " or less";
				res.send(disp_err);				
			}

			// setting for future football season
			else {

				// set status variables for past sports //

				// football variables
				this_football_season_started = true;
				this_football_completed_season = false;
				// full regular season = 13 matchups
				football_completed_matchups = football_ahead_completed_matchups;

				// basketball variables
				this_basketball_season_started = false;
				this_basketball_completed_season = false;
				// full regular season = 18 matchups
				basketball_completed_matchups = 0;	

				// baseball variables
				this_baseball_season_started = false;
				this_baseball_completed_season = false;
				// full regular season = 22 matchups
				baseball_completed_matchups = 0;

				// if season_started == false or completed_season == true, skip scrape, just display
				// call matchups.js with all the necessary arguments
				var match = require('./matchups.js')(req, res, db, owner_number, year1, year2, this_football_season_started, football_completed_matchups, this_football_completed_season, this_basketball_season_started, basketball_completed_matchups, this_basketball_completed_season, this_baseball_season_started, baseball_completed_matchups, this_baseball_completed_season);				

			} // end of else for future football
		} // end of else for error case and future football season
	}
}); // end of owner to owner matchups 


// route to individual owner's matchups for all trifecta seasons
router.get('/owner/:owner_number/matchups/all', function(req, res) {
	
	// pull parameters from request URL
	var owner_number = req.params.owner_number;

	if (this_football_season_started == true && this_football_completed_season == false) {
		var football_in_season = true;
		if (football_completed_matchups == 0) {
			var football_in_season = false;
		}
	}
	else {
		if (football_ahead == false) {
			var football_in_season = false;
		}
		// if future football season
		else {
			var football_in_season = true;
			if (football_completed_matchups == 0) {
				var football_in_season = false;
			}
		}
	}

	if (this_basketball_season_started == true && this_basketball_completed_season == false) {
		var basketball_in_season = true;
		if (basketball_completed_matchups == 0) {
			var basketball_in_season = false;
		}		
	}
	else {
		var basketball_in_season = false;
	}

	if (this_baseball_season_started == true && this_baseball_completed_season == false) {
		var baseball_in_season = true;
		if (baseball_completed_matchups == 0) {
			var baseball_in_season = false;
		}		
	}
	else {
		var baseball_in_season = false;
	}

	var disp_football_matchups = null;
	var disp_basketball_matchups = null;
	var disp_baseball_matchups = null;
	var disp_trifecta_matchups = null;

	var options = {
		args: [owner_number, completed_football_season, football_in_season, completed_basketball_season, basketball_in_season, completed_baseball_season, baseball_in_season]
	}
	console.log(options);

	db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"]
		//console.log(owner_name);

		pyshell.run('total_owner_matchups.py', options, function(err) {
			if (err) throw err;
			console.log("total matchups python script complete");


			db.collection('owner' + owner_number + '_football_matchups_all').find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				console.log(docs);
				console.log('pulling football data...');
				disp_football_matchups = docs;
				complete();
			})

			db.collection('owner' + owner_number + '_basketball_matchups_all').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				console.log(docs);
				console.log('pulling basketball data...');
				disp_basketball_matchups = docs;
				complete();

			})

			db.collection('owner' + owner_number + '_baseball_matchups_all').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				console.log(docs);
				console.log('pulling baseball data...');
				disp_baseball_matchups = docs;
				complete();
			})

			db.collection('owner' + owner_number + '_trifecta_matchups_all').find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
				console.log(docs);
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
	} // end of complete function
}); // end of owner to owner matchups 

// route to home page for all individual owner matchup data
router.get('/trades_home_page', function(req, res) {
	res.render('trades_home_page');
})

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

			if (trades_processed == 0) {
				res.send("Oh no! No trades have been made!")
			}

			else {
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
							}) // end of pull for trade display
						}) // end of pyshell
					}) // end of trade stats
				} // end of if football

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
							}) // end of trade display
						}) // end of pyshell
					}) // end of trade stats
				} // end of if basketball

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
							}) // end of trade display
						}) // end of pyshell
					}) // end of trade stats
				} // end of if baseball				
			} // end of if no trades were made

		}) // end of trade script
	} // end of need to scrape

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
				}) // end of trade display
			} 
		} // end of if football

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
				}) // end of trade display
			}
		} // end of if basketball

		// if sport is baseball
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
			}) // end of trade display
		} // end of if baseball
	} // end of no scrape, just display

}) // end of route to trades


// route to acquisition home page
router.get('/acquisition_value_home_page', function(req, res) {
	res.render('acquisition_value_home_page');
}) // end of acquisition home page


// route to football and basketball acquistion values
router.get('/owner/:owner_number/:sport/acquisitions/:year', function(req, res) {

	// set variables from request url
	var sport = req.params.sport;
	var year = req.params.year;
	var owner_number = req.params.owner_number

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

	// if year is greater than what's been completed, scrape
	if (year > completed_sport_season) {

		// if sport is football
		if (sport == 'football') {

			// if owner is all
			if (owner_number == 'all') {

				// scrape draft once
				var football_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
					console.log("drafted players done");

					// set array of numbers
					var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

					// call function that synchronously loops through acquistions for each team
					all_football_acquisitions(0, owner_list);
					
				}) // end of draft scrape


				// function that synchronously updates acquisitions for each team
				var all_football_acquisitions = function(x, owner_list) {

					if (x < owner_list.length) {

						owner_number = owner_list[x];
						console.log("owner number", owner_number);

						var active_stats = require('./football_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
							console.log("active stats scrape done");

							var football_add = require('./football_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								var football_aux = require('./football_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
									console.log("aux stats added");

									var options = {
										args: [sport, year, owner_number]
									}

									pyshell.run('football_acquisitions.py', options, function(err) {
										console.log("acquisitions python script complete");

										all_football_acquisitions(x + 1, owner_list);
									
									}) // end of pyshell 
								}) // end of football auxiliary
							}) // end of football add 
						}) // end of active stats
					}

					// if done with all the owners in owners_list
					else {

						// reset owner number (after it has gone through loop) to all for all display
						owner_number = 'all';
						var acquisitions_display = require('./acquisitions_display.js')(req, res, db, sport, year, owner_number)			
					}

				} // end of all_football_acquisitions function

			} // end of all owners

			// if owner is a specific owner
			else {

				// send to script that adds drafted players
				var football_draft = require('./draft.js')(req, res, db, sport, year, function(err, call2) {
					console.log("drafted players done");			
				
					// send to script that pulls active stats
					var active_stats = require('./football_active_stats.js')(req, res, db, sport, year, owner_number, function(err, football_owner_number) {
						console.log("active stats scrape done");

						// send to script that adds added players
						var football_add = require('./football_add.js')(req, res, db, sport, year, owner_number, function(err, call) {
							console.log("added players done");

							var football_auxiliary = require('./football_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call4) {
								console.log("aux stats complete");

								var options = {
									args: [sport, year, owner_number]
								}

								// python script that determines acqusition value
								pyshell.run('football_acquisitions.py', options, function(err) {
									console.log("acquisition python script complete");
									var acquisitions_display = require('./acquisitions_display.js')(req, res, db, sport, year, owner_number)			
								}) // end of python script

							}) // end of aux
						}) // end of football draft script
					}) // end of football add script
				})	// end of footbabll draft
			} // end of else for specific owner
		} // end of if football

		else if (sport == 'basketball') {

			if (owner_number == 'all') {
				
				// scrape PR once
				var pr_scrape = require('./basketball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
					console.log("PR scrape done");

					// scrape draft once
					var basketball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
						console.log("drafted players done");

						// set array of numbers
						var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

						// call function that synchronously loops through acquistions for each team
						all_basketball_acquisitions(0, owner_list);
						
					}) // end of draft scrape
				}) // end of pr scrape	


			// function that synchronously updates acquisitions for each team
			var all_basketball_acquisitions = function(x, owner_list) {

				if (x < owner_list.length) {

					owner_number = owner_list[x];
					console.log("owner number", owner_number);

					var active_stats = require('./basketball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
						console.log("active stats scrape done");

						var basketball_add = require('./basketball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
							console.log("added players done");

							var basketball_aux = require('./basketball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
								console.log("aux stats added");

								var options = {
									args: [sport, year, owner_number]
								}

								pyshell.run('basketball_acquisitions.py', options, function(err) {
									console.log("acquisitions python script complete");

									all_basketball_acquisitions(x + 1, owner_list);
								
								}) // end of pyshell 
							}) // end of basketball auxiliary
						}) // end of basketball add 
					}) // end of active stats
				}

				// if done with all the owners in owners_list
				else {

					// reset owner number (after it has gone through loop) to all for all display
					owner_number = 'all';
					var acquisitions_display = require('./acquisitions_display.js')(req, res, db, sport, year, owner_number)			
				}
			} // end of all_basketball_acquisitions function


			} // end of all owners			

			else {

				// scrape PR
				var pr_scrape = require('./basketball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
					console.log("PR scrape done");

					// scrape draft
					var basketball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
						console.log("drafted players done");

						// scrape active stats
						var active_stats = require('./basketball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
							console.log("active stats scrape done");

							// scrape and intialize acquired
							var basketball_add = require('./basketball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								// add drafted and PR to acqusitions
								var basketball_aux = require('./basketball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
									console.log("aux stats added");

									var options = {
										args: [sport, year, owner_number]
									}

									// python  script that determines acquisition value
									pyshell.run('basketball_acquisitions.py', options, function(err) {
										console.log('acquisitions python sript done');
										var acquisitions_display = require('./acquisitions_display.js')(req, res, db, sport, year, owner_number)
									}) // end of pyshell 
								}) // end of basketball aux
							}) // end of basketball add 
						}) // end of active stats 
					}) // end of draft scrape
				}) // end of pr scrape
			} 
		} // end of if basketball

		// make sure sport is baseball
		if (sport === 'baseball') {

			// if all owners
			if (owner_number == 'all') {
				
				// scrape draft once
				var baseball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
					console.log("drafted players done");		

					// scrape PRs once
					var pr_scrape = require('./baseball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
						console.log("pr srape done");	

						// set array of numbers
						var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

						// call function that synchronously loops through acquistions for each team
						all_baseball_acquisitions(0, owner_list);
						
					}) // end of draft scrape
				}) // end of pr scrape	

				// function that synchronously updates acquisitions for each team
				var all_baseball_acquisitions = function(x, owner_list) {

					// loop through owner list
					if (x < owner_list.length) {

						// set owner number
						owner_number = owner_list[x];
						console.log("owner number", owner_number);

						// scrape active stats
						var active_stats = require('./baseball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call1) {
							console.log("active stats scrape done");

							// scrape additions
							var baseball_add = require('./baseball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								// add aux stats in
								var baseball_aux = require('./baseball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) { 
									console.log("aux stats done");

									var options = {
										args: [sport, year, owner_number]
									}

									// create acquisition values
									pyshell.run('baseball_acquisitions.py', options, function(err) {
										console.log("acquisitions python script done");
										all_baseball_acquisitions(x + 1, owner_list);
									}) // end of pyshell										
								}) // end of basketball auxiliary
							}) // end of basketball add 
						}) // end of active stats
					}

					// if done with all the owners in owners_list
					else {
						// reset owner number (after it has gone through loop) to all for all display
						owner_number = 'all';
						console.log("all owners done")
						var acquisitions_display = require('./acquisitions_display.js')(req, res, db, sport, year, owner_number)			
					}
				} // end of all_basketball_acquisitions function
			
			} // end of if all owners

			// if individual owner
			else {
				// scrape drafted
				var baseball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
					console.log("drafted players done");		

					// scrape PRs
					var pr_scrape = require('./baseball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
						console.log("pr srape done");			

						// scrape active stats
						var active_stats = require('./baseball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call1) {
							console.log("active stats scrape done");

							// scrape additions
							var baseball_add = require('./baseball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								var baseball_aux = require('./baseball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) { 
									console.log("aux stats done");

									var options = {
										args: [sport, year, owner_number]
									}

									// create acquisition values
									pyshell.run('baseball_acquisitions.py', options, function(err) {
										console.log("python script done");
										var acquisitions_display = require('./acquisitions_display.js')(req, res, db, sport, year, owner_number)			
									}) // end of pyshell						

								}) // end of baseball aux include
							}) // end of add scrape
						}) // end of active stats scrape
					}) // end of pr scrape
				}) // end of draft scrape			
			} // end of if individual owner
		} // end of if baseball check		
	}
	// if don't need to scrape, just pull, sort and display
	else {

		var acquisitions_display = require('./acquisitions_display.js')(req, res, db, sport, year, owner_number)

	} // end of if don't need to scrape, just dispaly
	
}) // end of route to football and basketball acquisition stats


// route to acquisition home page
router.get('/stats_home_page', function(req, res) {
	res.render('stats_home_page');
}) // end of acquisition home page

// route to roster stats
router.get('/owner/:owner_number/:sport/stats/:year', function(req, res) {

	// set variables from request url
	var sport = req.params.sport;
	var year = req.params.year;
	var owner_number = req.params.owner_number

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

	// if year is greater than what's been completed, scrape
	if (year > completed_sport_season) {

		// if sport is football
		if (sport == 'football') {

			// if owner is all
			if (owner_number == 'all') {

				// scrape draft once
				var football_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
					console.log("drafted players done");

					// set array of numbers
					var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

					// call function that synchronously loops through acquistions for each team
					all_football_acquisitions(0, owner_list);
					
				}) // end of draft scrape


				// function that synchronously updates acquisitions for each team
				var all_football_acquisitions = function(x, owner_list) {

					if (x < owner_list.length) {

						owner_number = owner_list[x];
						console.log("owner number", owner_number);

						var active_stats = require('./football_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
							console.log("active stats scrape done");

							var football_add = require('./football_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								var football_aux = require('./football_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
									console.log("aux stats added");

									var options = {
										args: [sport, year, owner_number]
									}

									pyshell.run('football_acquisitions.py', options, function(err) {
										console.log("acquisitions python script complete");

										all_football_acquisitions(x + 1, owner_list);
									
									}) // end of pyshell 
								}) // end of football auxiliary
							}) // end of football add 
						}) // end of active stats
					}

					// if done with all the owners in owners_list
					else {

						// reset owner number (after it has gone through loop) to all for all display
						owner_number = 'all';
						var acquisitions_display = require('./stats_display.js')(req, res, db, sport, year, owner_number)			
					}

				} // end of all_football_acquisitions function

			} // end of all owners

			// if owner is a specific owner
			else {

				// send to script that adds drafted players
				var football_draft = require('./draft.js')(req, res, db, sport, year, function(err, call2) {
					console.log("drafted players done");			
				
					// send to script that pulls active stats
					var active_stats = require('./football_active_stats.js')(req, res, db, sport, year, owner_number, function(err, football_owner_number) {
						console.log("active stats scrape done");

						// send to script that adds added players
						var football_add = require('./football_add.js')(req, res, db, sport, year, owner_number, function(err, call) {
							console.log("added players done");

							var football_auxiliary = require('./football_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call4) {
								console.log("aux stats complete");

								var options = {
									args: [sport, year, owner_number]
								}

								// python script that determines acqusition value
								pyshell.run('football_acquisitions.py', options, function(err) {
									console.log("acquisition python script complete");
									var acquisitions_display = require('./stats_display.js')(req, res, db, sport, year, owner_number)			
								}) // end of python script

							}) // end of aux
						}) // end of football draft script
					}) // end of football add script
				})	// end of footbabll draft
			} // end of else for specific owner
		} // end of if football

		else if (sport == 'basketball') {

			if (owner_number == 'all') {
				
				// scrape PR once
				var pr_scrape = require('./basketball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
					console.log("PR scrape done");

					// scrape draft once
					var basketball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
						console.log("drafted players done");

						// set array of numbers
						var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

						// call function that synchronously loops through acquistions for each team
						all_basketball_acquisitions(0, owner_list);
						
					}) // end of draft scrape
				}) // end of pr scrape	


			// function that synchronously updates acquisitions for each team
			var all_basketball_acquisitions = function(x, owner_list) {

				if (x < owner_list.length) {

					owner_number = owner_list[x];
					console.log("owner number", owner_number);

					var active_stats = require('./basketball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
						console.log("active stats scrape done");

						var basketball_add = require('./basketball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
							console.log("added players done");

							var basketball_aux = require('./basketball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
								console.log("aux stats added");

								var options = {
									args: [sport, year, owner_number]
								}

								pyshell.run('basketball_acquisitions.py', options, function(err) {
									console.log("acquisitions python script complete");

									all_basketball_acquisitions(x + 1, owner_list);
								
								}) // end of pyshell 
							}) // end of basketball auxiliary
						}) // end of basketball add 
					}) // end of active stats
				}

				// if done with all the owners in owners_list
				else {

					// reset owner number (after it has gone through loop) to all for all display
					owner_number = 'all';
					var acquisitions_display = require('./stats_display.js')(req, res, db, sport, year, owner_number)			
				}
			} // end of all_basketball_acquisitions function


			} // end of all owners			

			else {

				// scrape PR
				var pr_scrape = require('./basketball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
					console.log("PR scrape done");

					// scrape draft
					var basketball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
						console.log("drafted players done");

						// scrape active stats
						var active_stats = require('./basketball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
							console.log("active stats scrape done");

							// scrape and intialize acquired
							var basketball_add = require('./basketball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								// add drafted and PR to acqusitions
								var basketball_aux = require('./basketball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
									console.log("aux stats added");

									var options = {
										args: [sport, year, owner_number]
									}

									// python  script that determines acquisition value
									pyshell.run('basketball_acquisitions.py', options, function(err) {
										console.log('acquisitions python sript done');
										var acquisitions_display = require('./stats_display.js')(req, res, db, sport, year, owner_number)
									}) // end of pyshell 
								}) // end of basketball aux
							}) // end of basketball add 
						}) // end of active stats 
					}) // end of draft scrape
				}) // end of pr scrape
			} 
		} // end of if basketball

		// make sure sport is baseball
		if (sport === 'baseball') {

			// if all owners
			if (owner_number == 'all') {
				
				// scrape draft once
				var baseball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
					console.log("drafted players done");		

					// scrape PRs once
					var pr_scrape = require('./baseball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
						console.log("pr srape done");	

						// set array of numbers
						var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

						// call function that synchronously loops through acquistions for each team
						all_baseball_acquisitions(0, owner_list);
						
					}) // end of draft scrape
				}) // end of pr scrape	

				// function that synchronously updates acquisitions for each team
				var all_baseball_acquisitions = function(x, owner_list) {

					// loop through owner list
					if (x < owner_list.length) {

						// set owner number
						owner_number = owner_list[x];
						console.log("owner number", owner_number);

						// scrape active stats
						var active_stats = require('./baseball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call1) {
							console.log("active stats scrape done");

							// scrape additions
							var baseball_add = require('./baseball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								// add aux stats in
								var baseball_aux = require('./baseball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) { 
									console.log("aux stats done");

									var options = {
										args: [sport, year, owner_number]
									}

									// create acquisition values
									pyshell.run('baseball_acquisitions.py', options, function(err) {
										console.log("acquisitions python script done");
										all_baseball_acquisitions(x + 1, owner_list);
									}) // end of pyshell										
								}) // end of basketball auxiliary
							}) // end of basketball add 
						}) // end of active stats
					}

					// if done with all the owners in owners_list
					else {
						// reset owner number (after it has gone through loop) to all for all display
						owner_number = 'all';
						console.log("all owners done")
						var acquisitions_display = require('./stats_display.js')(req, res, db, sport, year, owner_number)			
					}
				} // end of all_basketball_acquisitions function
			
			} // end of if all owners

			// if individual owner
			else {
				// scrape drafted
				var baseball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
					console.log("drafted players done");		

					// scrape PRs
					var pr_scrape = require('./baseball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
						console.log("pr srape done");			

						// scrape active stats
						var active_stats = require('./baseball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call1) {
							console.log("active stats scrape done");

							// scrape additions
							var baseball_add = require('./baseball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
								console.log("added players done");

								var baseball_aux = require('./baseball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) { 
									console.log("aux stats done");

									var options = {
										args: [sport, year, owner_number]
									}

									// create acquisition values
									pyshell.run('baseball_acquisitions.py', options, function(err) {
										console.log("python script done");
										var acquisitions_display = require('./stats_display.js')(req, res, db, sport, year, owner_number)			
									}) // end of pyshell						

								}) // end of baseball aux include
							}) // end of add scrape
						}) // end of active stats scrape
					}) // end of pr scrape
				}) // end of draft scrape			
			} // end of if individual owner
		} // end of if baseball check		
	}
	// if don't need to scrape, just pull, sort and display
	else {

		var stats_display = require('./stats_display.js')(req, res, db, sport, year, owner_number)

	} // end of if don't need to scrape, just dispaly
	
}) // end of route to football and basketball acquisition stats

// route to origin home page
router.get('/origin_home_page', function(req, res) {
	res.render('origin_home_page')
});

// route to origin analysis
router.get('/:sport/origin/:year', function(req, res) {

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

	if (year > completed_sport_season) {
		
		if (sport == "football") {

			// send to script that adds drafted players
			var football_draft = require('./draft.js')(req, res, db, sport, year, function(err, call2) {
				console.log("drafted players done");

				// set array of numbers
				var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]				

				// call function that synchronously loops through acquistions for each team
				all_football_origin(0, owner_list);		

			})	// end of footbabll draft

	// function that synchronously updates acquisitions for each team
	var all_football_origin = function(x, owner_list) {

		if (x < owner_list.length) {

			owner_number = owner_list[x];
			console.log("owner number", owner_number);

			var active_stats = require('./football_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
				console.log("active stats scrape done");

				var football_add = require('./football_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
					console.log("added players done");

					var football_aux = require('./football_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
						console.log("aux stats added");

						var options = {
							args: [sport, year, owner_number]
						}

						pyshell.run('football_origin.py', options, function(err) {
							console.log("origin python script complete");

							all_football_origin(x + 1, owner_list);
						
						}) // end of pyshell 
					}) // end of football auxiliary
				}) // end of football add 
			}) // end of active stats
		}
		// if done with all the owners in owners_list
		else {
			// reset owner number (after it has gone through loop) to all for all display
			db.collection(sport + "_origin_" + year).find({}, {"_id": 0}).sort({"total_points": -1}).toArray(function(e, docs) {
				origin_standings = docs;

				console.log("displaying origin standings...");
				res.render('origin', {
					sport: sport,
					year: year,
					origin: origin_standings
				})
			})		
		}

	} // end of all_football_acquisitions function			
		
		} // end of if football

		else if (sport == 'basketball') {

			// scrape PR once
			var pr_scrape = require('./basketball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
				console.log("PR scrape done");

				// scrape draft once
				var basketball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
					console.log("drafted players done");

					// set array of numbers
					var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]	

					// call function that synchronously loops through acquistions for each team
					all_basketball_origin(0, owner_list);
					
				}) // end of draft scrape
			}) // end of pr scrape	


	// function that synchronously updates acquisitions for each team
	var all_basketball_origin = function(x, owner_list) {

		if (x < owner_list.length) {

			owner_number = owner_list[x];
			console.log("owner number", owner_number);

			var active_stats = require('./basketball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call){
				console.log("active stats scrape done");

				var basketball_add = require('./basketball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
					console.log("added players done");

					var basketball_aux = require('./basketball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) {
						console.log("aux stats added");

						var options = {
							args: [sport, year, owner_number]
						}

						pyshell.run('basketball_origin.py', options, function(err) {
							console.log("origin python script complete");

							all_basketball_origin(x + 1, owner_list);
						
						}) // end of pyshell 

					}) // end of basketball auxiliary
				}) // end of basketball add 
			}) // end of active stats
		}
		// if done with all the owners in owners_list
		else {

			// reset owner number (after it has gone through loop) to all for all display
			db.collection(sport + "_origin_" + year).find({}, {"_id": 0}).sort({"total_pr": -1}).toArray(function(e, docs) {
				origin_standings = docs;
				console.log("displaying origin standings...");
				res.render('origin', {
					sport: sport,
					year: year,
					origin: origin_standings
				})
			})					
		}

	} // end of all_basketball_acquisitions function
		
		} // end of if basketball

		else if (sport == 'baseball') {

			// scrape draft once
			var baseball_draft = require('./draft.js')(req, res, db, sport, year, function(err, call4) {
				console.log("drafted players done");		

				// scrape PRs once
				var pr_scrape = require('./baseball_acquisitions_pr.js')(req, res, db, sport, year, function(err, call2) {
					console.log("pr srape done");	

					// set array of numbers
					var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

					// call function that synchronously loops through acquistions for each team
					all_baseball_origin(0, owner_list);
					
				}) // end of draft scrape
			}) // end of pr scrape	

	// function that synchronously updates acquisitions for each team
	var all_baseball_origin = function(x, owner_list) {

		// loop through owner list
		if (x < owner_list.length) {

			// set owner number
			owner_number = owner_list[x];
			console.log("owner number", owner_number);

			// scrape active stats
			var active_stats = require('./baseball_active_stats.js')(req, res, db, sport, year, owner_number, function(err, call1) {
				console.log("active stats scrape done");

				// scrape additions
				var baseball_add = require('./baseball_add.js')(req, res, db, sport, year, owner_number, function(err, call3) {
					console.log("added players done");

					// add aux stats in
					var baseball_aux = require('./baseball_acquisitions_aux.js')(req, res, db, sport, year, owner_number, function(err, call5) { 
						console.log("aux stats done");

						var options = {
							args: [sport, year, owner_number]
						}

						// create acquisition values
						pyshell.run('baseball_origin.py', options, function(err) {
							console.log("origin python script done");
							all_baseball_origin(x + 1, owner_list);
						}) // end of pyshell						

					}) // end of basketball auxiliary
				}) // end of basketball add 
			}) // end of active stats
		}
		// if done with all the owners in owners_list
		else {
			// reset owner number (after it has gone through loop) to all for all display
			db.collection(sport + "_origin_" + year).find({}, {"_id": 0}).sort({"total_pr": -1}).toArray(function(e, docs) {
				origin_standings = docs;
				console.log("displaying origin standings...");
				res.render('origin', {
					sport: sport,
					year: year,
					origin: origin_standings
				})
			})		
		}
	} // end of all_basall_acquisitions function

		} // end of if baseball		
	
	} // end of if need to scrape

	// if year is in past and just display
	else {

		if (sport == "football") {
					// reset owner number (after it has gone through loop) to all for all display
			db.collection(sport + "_origin_" + year).find({}, {"_id": 0}).sort({"total_points": -1}).toArray(function(e, docs) {
				origin_standings = docs;
				console.log("displaying origin standings...");
				res.render('origin', {
					sport: sport,
					year: year,
					origin: origin_standings
				})
			})			
		}

		else {
			// reset owner number (after it has gone through loop) to all for all display
			db.collection(sport + "_origin_" + year).find({}, {"_id": 0}).sort({"total_pr": -1}).toArray(function(e, docs) {
				origin_standings = docs;
				console.log("displaying origin standings...");
				res.render('origin', {
					sport: sport,
					year: year,
					origin: origin_standings
				})
			})	
		}		
	} // end of if just display

}); // end of origin route

// home page for football coach rankings
router.get('/football_coach_home_page', function(req, res) {
	res.render('football_coach_home_page');
})

// route to analyze fantasy football "coaching" aka starting lineup optimization
router.get('/football/coach/:year', function(req, res) {

	// set variables from request url
	var year = req.params.year;

	// if year is greater than completed season, SCRAPE
	if (year > completed_football_season) {
	
		// how many weeks have been completed, able to scrape
		if (football_ahead == true) {
			var completed_weeks = football_ahead_completed_matchups;

		}
		else {
			var completed_weeks = football_completed_matchups
		}

		// list of owner numbers to loop through
		owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

	// function that executes synchronous scrapes and python script analyses
	var all_football_coach = function(x, owner_list) {
		if (x < owner_list.length) {
			// set owner number
			owner_number = owner_list[x];
			console.log("owner number", owner_number);

			// scrape starting lineups and benches from each week
			var coach_scrape = require('./coach_scrape.js')(req, res, db, year, owner_number, completed_weeks, function(err, call) {
				console.log("coach scrape done");

				// send back to loop again
				all_football_coach(x + 1, owner_list);
			}) // end of coach scrape script
		}
		// once done with all in loop, done
		else {
			var options = {
				args: [year, completed_weeks]
			}
			pyshell.run('football_coach.py', options, function(err) {
				if (err) throw err;
				console.log("coach python script done");
				
				// pull from collection for display
				db.collection("all_coach_" + year).find({}, {"_id": 0}).sort({"season": -1}).toArray(function(e, docs) {
					disp_coach = docs;
					console.log("displaying coach standings...");

					res.render('football_coach', {
						year: year,
						completed_weeks: completed_weeks,
						coach_standings: disp_coach
					})
				}) // end of display pull				
			}) // end of python script
	
		}
	} // end of all_football_coach function

		// run synchronous for loop function
		all_football_coach(0, owner_list);
	} // end of if need to be scraped

	// if year is in past, just pull
	else {
		completed_weeks = 13
		// pull from collection for display
		db.collection("all_coach_" + year).find({}, {"_id": 0}).sort({"season": -1}).toArray(function(e, docs) {
			disp_coach = docs;
			console.log("displaying coach standings...");

			res.render('football_coach', {
				year: year,
				completed_weeks: completed_weeks,
				coach_standings: disp_coach
			})
		}) // end of display pull	
	} // end of just pull
						
}) // end of route to coach analysis

// route to popular home page
router.get('/popular_home_page', function(req, res) {
	res.render('popular_home_page');
})

// route to get most popular players
router.get('/:sport/popular/:year', function(req, res) {
	var sport = req.params.sport;
	var year = req.params.year;

// function that scrapes and calculates most popular players per owner per sport
var all_popular = function(x, owner_list) {

	if (x < owner_list.length) {
		owner_number = owner_list[x];
		console.log("owner number", owner_number);

		var popular = require('./popular.js')(req, res, db, sport, year, owner_number, function(err, call) {
			console.log("popular scrape done");

			var options = {
				args: [sport, year, owner_number]
			}

			// python script that calculates players with most transactions per team
			pyshell.run('popular_individual.py', options, function(err) {
				console.log("popular python script done");

				// send back through loop
				all_popular(x + 1, owner_list)
			}) // end of pyshell
		}) // end of popular.js scrape
	} // end of if still in loop
	
	// if finished with loop
	else {
		var options = {
			args: [sport, year]
		}

		// python script that calculates player that was on most teams and owners who had player on roster
		pyshell.run('popular_all.py', options, function(err) {
			console.log("all popular python script done");

			// pull all owner names NOT "all", ie all individual owners
			db.collection(sport + "_popular_" + year).find({"owner": {"$not": /all/}}, {"_id": 0}, {"sort": [["transactions", "desc"], ["owner", "desc"], [score_cat, "desc"]]}).toArray(function(e, docs) {
				disp_individual = docs;

				// pull owner that is all (has player on most teams data)
				db.collection(sport + "_popular_" + year).find({"owner": "all"}, {"_id": 0}).toArray(function(e, docs2) {
					disp_all = docs2;

					console.log("displaying most popular players...")
					res.render('popular', {
						sport: sport,
						year: year,
						popular_individual: disp_individual,
						popular_all: disp_all
					}) // end of render
				}) // end of all popular pull
			}) // end of individual popular pull
		}) // end of pyshell
	} // end of else
} // end of function

// start of executed script //
	var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

	// set completed season and scoring category depending on sport
	if (sport == "football") {
		completed_sport_season = completed_football_season;
		score_cat = "PTS";
	}
	else if (sport == "basketball") {
		completed_sport_season = completed_basketball_season;
		score_cat = "weighted_PR"
	}
	else if (sport == "baseball") {
		completed_sport_season = completed_baseball_season;
		score_cat = "weighted_PR"
	}

	// if season not completed, scrape
	if (year > completed_sport_season) {
		all_popular(0, owner_list);
	}
	// else just pull and display
	else {
		db.collection(sport + "_popular_" + year).find({"owner": {"$not": /all/}}, {"_id": 0}, {"sort": [["transactions", "desc"], ["owner", "desc"], [score_cat, "desc"]]}).toArray(function(e, docs) {
			disp_individual = docs;

			db.collection(sport + "_popular_" + year).find({"owner": "all"}, {"_id": 0}).toArray(function(e, docs2) {
				disp_all = docs2;

				console.log("displaying most popular players...")
				res.render('popular', {
					sport: sport,
					year: year,
					popular_individual: disp_individual,
					popular_all: disp_all
				}) // end od render
			}) // end of all pull
		}) // end of individual pull
	} // end of else
}) // end of route to sport popular
