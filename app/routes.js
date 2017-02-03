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

router.get('/:sport/trades/:year', function(req, res) {

	// set variables from request url
	var sport = req.params.sport;
	var year = req.params.year;

	var trade = require('./trade.js')(req, res, db, sport, year, function(err, owner_number_list, trades_processed, players_processed) {

		owner_number_list = owner_number_list.filter(function(item, index, inputArray) {
			return inputArray.indexOf(item) == index;
		})
		//console.log("new owner numbers: ", owner_number_list);

		console.log("trades processed: ", trades_processed)
		console.log("players processed: ", players_processed)


		if (sport === 'basketball') {
			var trade_stats = require('./basketball_trade_stats.js')(req, res, db, sport, year, owner_number_list, function(err, call) {
				console.log("scrape done");
				var options = {
					args: [sport, year]
				}

				pyshell.run('basketball_trade_analysis.py', options, function(err) {
					if (err) throw err;
					console.log('trade python script complete');

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

		else if (sport === 'football') {
			var trade_stats = require('./football_trade_stats.js')(req, res, db, sport, year, owner_number_list, function(err, call) {
				console.log("scrape done");

				var options = {
					args: [sport, year]
				}

				pyshell.run('football_trade_analysis.py', options, function(err) {
					if (err) throw err;
					console.log('trade python script complete');

					db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"], ["PTS", "asc"]]}).toArray(function(e, docs) {
						console.log('displaying trade analysis...');
						disp_trade = docs;
						res.render('football_trade', {
							year: year,
							trader: disp_trade,
							trades_processed: math.range(1, trades_processed)
						})
					})
				})
			}) 					
		}

		else if (sport === 'baseball') {
			var trade_stats = require('./baseball_trade_stats.js')(req, res, db, sport, year, owner_number_list, function(err, call) {
				console.log("scrape done");

				var options = {
					args: [sport, year]
				}

				pyshell.run('baseball_trade_analysis.py', options, function(err) {
					if (err) throw err;
					console.log('trade python script complete');

					db.collection(sport + "_trades_" + year).find({}, {"_id": 0}, {"sort": [["trade_number", "asc"], ["player", "asc"], ["owner", "asc"]]}).toArray(function(e, docs) {
						console.log('displaying trade analysis...');
						disp_trade = docs;
						res.render('baseball_trade', {
							year: year,
							trader: disp_trade,
							trades_processed: math.range(1, trades_processed)
						})
					})
				})
				
			})
		}

	});


});


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
					console.log(docs);
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
