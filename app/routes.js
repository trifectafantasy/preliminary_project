///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

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

// create router object
var router = express.Router();
// export router to server.js file
module.exports = router;

// Route to Home/Root page
router.get('/', function(req, res) {

	res.render('index', {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	});
});

// route to only 2015-2016 trifecta standings
router.get('/trifecta_standings=2015_2016', function(req, res) {
	var year1 = 2015;
	var year2 = 2016;

	var disp_trifecta_standings = null;

	// pull from 2015-2016 trifecta season collection and sort by total trifecta points
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

});

// template for trifecta standings 
router.get('/trifecta_standings=2016_2017', function(req, res) {
	var year1 = 2016;
	var year2 = 2017;
	var football_in_season = "yes";
	var basketball_in_season = "yes";
	var baseball_in_season = "no";

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

})

// route to /football_standings
router.get('/football_standings=2015', function(req, res) {
	var year = 2015;
	var playoffs = true;

///// Don't need to scrape anymore. See football_router_template.js for scrape ////

///// EXECUTE SCRIPT /////
	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_trifecta_standings = null;

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
				res.render('football_standings_playoffs', {
					h2h_standings: disp_h2h_standings,
					trifecta_standings: disp_trifecta_standings,
					year: year
				});
			}			
		}
		else {
			if (disp_h2h_standings !== null) {

				// render to standings
				res.render('football_standings', {
					h2h_standings: disp_h2h_standings,
					year: year
				});
			}			
		}
	}

}); // end of .get('/foottball_standings')


// route to /football_standings
router.get('/football_standings=2016', function(req, res) {
	var year = 2016;
	var playoffs = true;

///// EXECUTE SCRIPT /////
	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_trifecta_standings = null;

	// pull from mongodb and display new data after python script finishes
	db.collection('football_h2h_' + year).find({}, {"_id": 0}).sort({"trifecta_points": -1}).toArray(function(e, docs) {
		//console.log(docs);
		console.log("Displaying h2h data...")
		disp_h2h_standings = docs;
		// call complete to see if both finds are done
		complete();
	});

	// if playoffs are true, display trifecta standings
	if (playoffs === true) {
		// set year as argument for python script
		var options = {
			args: [year]
		};

		// count number of documents in trifecta database
		db.collection('football_trifecta_' + year).count({}, function(err, num){

			// if 10 documents, database is full and just read trifecta database sorted by total trifecta points
			if (num === 10) {
					db.collection('football_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
						//console.log(docs);
						console.log("Displaying playoff data...");
						disp_trifecta_standings = docs;
						complete();
					});				
			}
			else {
				// if trifecta database is not filled, run playoffs python script
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
				res.render('football_standings_playoffs', {
					h2h_standings: disp_h2h_standings,
					trifecta_standings: disp_trifecta_standings,
					year: year
				});
			}			
		}
		else {
			if (disp_h2h_standings !== null) {

				// render to standings
				res.render('football_standings', {
					h2h_standings: disp_h2h_standings,
					year: year
				});
			}			
		}
	}

}); // end of .get('/football_standings')


// route to /basketball_standings
router.get('/basketball_standings=2016', function(req, res) {
	var year = 2016;
	var playoffs = true;

///// EXECUTE SCRIPT /////

	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_roto_standings = null;
	var disp_trifecta_standings = null;

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
				res.render('basketball_standings_playoffs', {
					h2h_standings: disp_h2h_standings,
					roto_standings: disp_roto_standings,
					trifecta_standings: disp_trifecta_standings,
					year: year
				});
			}
		}
		else {
			if (disp_h2h_standings !== null && disp_roto_standings !== null) {

				// render to baseball_standings
				res.render('basketball_standings', {
					h2h_standings: disp_h2h_standings,
					roto_standings: disp_roto_standings,
					year: year
				});
			}
		}
	}

}); // end of .get('/basketball_standings')

// route to /basketball_standings
router.get('/basketball_standings=2017', function(req, res) {
	var year = 2017;
	var playoffs = false;
	// url for basketball 2016 standings
	var url = 'http://games.espn.com/fba/standings?leagueId=100660&seasonId=' + year;

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			// initialize variables that will be used in scrape later
			var division, team, wins, losses, ties, win_per
			var h2h_standings = new Array();

			var h2h_rank, team, FG_PCT, FT_PCT, THREEPM, REB, AST, STL, BLK, TO, PTS
			var roto_standings = new Array();

			// scraping h2h records and standings
			// for each team row in the h2h standings
			$('tr[class=tableBody]').each(function(i, element) {

				// store sraped data for each team in json
				var json1 = {
					team: "",
					wins: "",
					losses: "",
					ties: "",
					win_per: "",
					division: ""
				};

				// traversing the DOM
				///// MAKE SURE YOU USE FIRST() OR NEXT() TO ACTUALLY GO INTO LEVEL OF CHILDREN /////
				division = $(this).parent().children().first();
				team = $(this).children().children();
				wins = team.parent().next();
				losses = wins.next();
				ties = losses.next();
				win_per = ties.next();

				// inserting scraped data converting either to TEXT, INT, or FLOAT
				json1.division = division.text();
				json1.team = team.text();
				json1.wins = parseInt(wins.text());
				json1.losses = parseInt(losses.text());
				json1.ties = parseInt(ties.text());
				json1.win_per = parseFloat(win_per.text()).toFixed(3);

				// push each team's json of data into array of all teams
				h2h_standings.push(json1);
			})

			// scraping roto stats and standings
			// for each team row in roto standings (note space " " in class name; it's possible)
			$('tr[class="tableBody sortableRow"]').each(function(i, element) {

				// store scraped data for each team as json
				var json2 = {
					h2h_rank: "",
					team: "",
					FG_PCT: "",
					FT_PCT: "",
					THREEPM: "",
					REB: "",
					AST: "",
					STL: "",
					BLK: "",
					TO: "",
					PTS: ""
				}

 				// traversing DOM
 				h2h_rank = $(this).children().first();
 				// hitting categories
 				team = h2h_rank.next();
 				FG_PCT = team.next().next();
 				FT_PCT = FG_PCT.next();
 				THREEPM = FT_PCT.next();
 				REB = THREEPM.next();
 				AST = REB.next();
 				STL = AST.next();
 				BLK = STL.next();
 				TO = BLK.next();
 				PTS = TO.next();
 
 				// store each scraped value in json as TEXT, INT, or FLOAT
 				json2.h2h_rank = parseInt(h2h_rank.text());
 				json2.team = team.text();
 				json2.FG_PCT = parseFloat(FG_PCT.text()).toFixed(4);
 				json2.FT_PCT = parseFloat(FT_PCT.text()).toFixed(4);
 				json2.THREEPM = parseInt(THREEPM.text());
 				json2.REB = parseInt(REB.text());
 				json2.AST = parseInt(AST.text());
 				json2.STL = parseInt(STL.text());
 				json2.BLK = parseInt(BLK.text());
 				json2.TO = parseInt(TO.text());
 				json2.PTS = parseInt(PTS.text());
 
 				// push each team's json of data into array of all teams
 				roto_standings.push(json2);

			})
			
			//console.log(standings);
			//console.log(roto_standings);

			///// DEFINE FUNCTIONS (so far still only defined inside the request) ///// 

			// asynchronous function that inserts both arrays into their appropriate collections
			// arguments are the database (db) and callback
			var insertDocument = function(db, year, callback) {

				// set collections
				var collection1 = db.collection('basketball_h2h_' + year);
				var collection2 = db.collection('basketball_roto_' + year);

				// remove all documents from collections to start fresh
				collection1.remove({});
				collection2.remove({});

				///// INSERT DOCUMENTS ASYNCHRONOUSLY /////

				// insert h2h standings array 
				collection1.insert(h2h_standings, function(err, result) {

			    	// insert roto standings array
					collection2.insert(roto_standings, function(err, result) {
			    		
			    		// assert to make sure no error
				    	assert.equal(err, null);
				    	console.log("Document 2 was inserted into the collection");
				    
				    	///// return callback after 2nd (innermost async) document is uploaded ///// 
				    	callback(result);
					});

					// assert to make sure no error
			    	assert.equal(err, null);
			    	console.log("Document 1 was inserted into the collection");
			    
			    	///// only return after 2nd document finishes uploading /////
			    	//callback(result);
				});
			}



///// EXECUTE SCRIPT /////

			// call insertDocumet asynchronously, but don't use db from callback as we need to use db from argument to find and get from to render
			insertDocument(db, year, function(callback) {

				console.log("All documents uploaded");

				// initialize year as argument for python script
				var options = {
					args: [year]
				}

				// run standings.py from python-shell to update collections with roto and trifecta points
				pyshell.run("basketball_standings.py", options, function(err) {
					
					if (err) throw err;
					console.log("Python script complete");

					// initialize display database queries
					var disp_h2h_standings = null;
					var disp_roto_standings = null;
					var disp_trifecta_standings = null;

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
								res.render('basketball_standings_playoffs', {
									h2h_standings: disp_h2h_standings,
									roto_standings: disp_roto_standings,
									trifecta_standings: disp_trifecta_standings,
									year: year
								});
							}
						}
						else {
							if (disp_h2h_standings !== null && disp_roto_standings !== null) {

								// render to baseball_standings
								res.render('basketball_standings', {
									h2h_standings: disp_h2h_standings,
									roto_standings: disp_roto_standings,
									year: year
								});
							}
						}
					}				

				}); // end of pyshell 
			}); // end of insertDocument 

		} // end of if(!error)
	}) // end of request
}) // end of .get('/basketball_standings')


// route to /baseball_standings
router.get('/baseball_standings=2016', function(req, res) {
	var year = 2016;
	var playoffs = true;

///// EXECUTE SCRIPT /////

	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_roto_standings = null;
	var disp_trifecta_standings = null;

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
				res.render('baseball_standings_playoffs', {
					h2h_standings: disp_h2h_standings,
					roto_standings: disp_roto_standings,
					trifecta_standings: disp_trifecta_standings,
					year: year
				});
			}			
		}
		else {
			if (disp_h2h_standings !== null && disp_roto_standings !== null) {

				// render to baseball_standings
				res.render('baseball_standings', {
					h2h_standings: disp_h2h_standings,
					roto_standings: disp_roto_standings,
					year: year
				});
			}			
		}

	}

}) // end of .get('/baseball_standings')


router.get('/owner2_matchups=2016_2017', function(req, res) {

///// SET VARIABLES //////
	// Set constant variables for all sports use
	var year1 = 2016;
	var year2 = 2017;
	var owner_number = 2;

	// variables that will never change
	var complete_count = 0;
	var sports_in_season_number = 0
	var disp_football_matchups = null;
	var disp_basketball_matchups = null;
	var disp_baseball_matchups = null;

	// football variables
	var football_in_season = true;
	// full regular season = 13 matchups
	var football_completed_matchups = 13;
	var football_playoffs = true;

	// basketball variables
	var basketball_in_season = true;
	// full regular season = 18 matchups
	var basketball_completed_matchups = 13;	
	var basketball_playoffs = false;

	// baseball variables
	var baseball_in_season = false;
	// full regular season = 18 matchups
	var baseball_completed_matchups = 1;
	var baseball_playoffs = false;

	// count how many sports are in season so know when to stop in complete()
	var sports_in_season_list = [football_in_season, basketball_in_season, baseball_in_season];
	for (c = 0; c < sports_in_season_list.length; c++) {
		if (sports_in_season_list[c] == true){
			sports_in_season_number += 1;
		}
	}


///// DEFINE FUNCTIONS USED BY ALL SPORTS /////

// complete function that when all in season sports have been pulled
var complete = function() {

	// iterate once whenever an individual sport is finished pulling/scraping
	complete_count += 1;

	// once all in season sports have been pulled
	console.log("sports in season: ", sports_in_season_number)
	if (complete_count == sports_in_season_number) {
		console.log("ready to display");

		// if baseball (and therefore all sports) is in season
		if (baseball_in_season == true) {

			// pull from mongodb and display new data after python script finishes
			db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying football matchup data...")
				disp_football_matchups = docs;
				// call display to see if all finds are done
				display();
			});

			db.collection("owner" + owner_number + "_basketball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying basketball matchup data...")
				disp_basketball_matchups = docs;
				// call display to see if all finds are done
				display();
			});

			db.collection("owner" + owner_number + "_baseball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying baseball matchup data...")
				disp_baseball_matchups = docs;
				// call display to see if all finds are done
				display();
			});			
		}

		// if basketball (and therefore football) is in season
		else if (basketball_in_season == true) {
			// pull from mongodb and display new data after python script finishes
			db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying football matchup data...")
				disp_football_matchups = docs;
				// call display to see if all finds are done
				display();
			});

			db.collection("owner" + owner_number + "_basketball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying basketball matchup data...")
				disp_basketball_matchups = docs;
				// call display to see if all finds are done
				display();
			});
		}

		else {
			// pull from mongodb and display new data after python script finishes
			db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying football matchup data...")
				disp_football_matchups = docs;
				// call display to see if all finds are done
				display();
			});
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

			// if playoffs are true (season over), don't need to recalculate matchups, just pull
			if (baseball_playoffs == true) {
				// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying Trifecta owner matchups...");
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
				pyshell.run('owner_matchups.py', options, function(err) {
					if (err) throw err;
					console.log("owner matchup python script complete");

					// read total trifecta season matchup collection
					db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
						console.log("Displaying Trifecta owner matchups...");
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

			// run owner mathups python script to calculate owner matchup stats
			pyshell.run('owner_matchups.py', options, function(err) {
				if (err) throw err;
				console.log("owner matchup python script complete");

				// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying trifecta owner matchups...");
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
	} // end of if basketball in season

	// if just football is in season
	else {

		// if necessary matchup docuements are filled
		if (disp_football_matchups != null) {

			// set python arguments
			var options = {
				args: [owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season]
			}			
			
			// run owner matchup python script to calculate owner matchup data
			pyshell.run('owner_matchups.py', options, function(err) {
				if (err) throw err;
				console.log("owner matchup python script complete");

					// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying Trifecta owner matchups...");
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
	} // end of if just football in season

	
} // end of display function definition

///// EXECUTE SCRIPT /////

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

		// if football is not in playoffs (aka in regular season), SCRAPE
		if (football_playoffs == false) {

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
								if (owner_team_list.includes(football_team1) == true) {

									// set team names
									football_my_team = football_team1;
									football_opposing_team = football_team2;
									//console.log(football_my_team);
									//console.log(football_pposing_team);

									// set points for and against
									PF = parseFloat(football_score1.text()).toFixed(1);
									PA = parseFloat(football_score2.text()).toFixed(1);

									// find opposing owner per opposing team
									football_opposing_owner = owners_per_team_name_list["teams"][football_opposing_team]["owner"]
									//console.log(football_opposing_owner);
								}

								// if team2 is in list of teams of the owner
								else if (owner_team_list.includes(football_team2) == true) {
									football_my_team = football_team2;

									//set team names
									football_opposing_team = football_team1;
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

		// if playoffs are over (true), then srape already done, skip straight to displaying
		else {
			console.log("football already done");

			// tell overall complete that football scraping and processing is done 
			complete();
		} // end of else playoffs

	} // end of if in season

	// if football is not in season (not started yet), so just skip, do nothing
	else {
		console.log("football not in season")
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
		pyshell.run('football_matchups.py', options, function(err) {
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

		// if playoffs are false (aka regular season), need to SCRAPE
		if (basketball_playoffs == false) {

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
								if (owner_team_list.includes(basketball_team1.text()) == true) {

									// set team names
									basketball_my_team = basketball_team1.text();
									basketball_opposing_team = basketball_team2.text();
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
								else if (owner_team_list.includes(basketball_team2.text()) == true) {

									// set team names
									basketball_my_team = basketball_team2.text();
									basketball_opposing_team = basketball_team1.text();
									//console.log(basketball_my_team);
									//console.log(opposing_team);		

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

		// if playoffs are complete, so scrape is already 
		else {
			console.log("basketball already done");

			// tell overall complete function that basketball scrape and processing is already done
			complete();
		} // end of else if playoffs
	} // end of if season

	// if not in season, skip
	else {
		console.log("basketball not in season")
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
		pyshell.run('basketball_matchups.py', options, function(err) {
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

		// if baseball playoffs are not done yet, so still in regular season
		if (baseball_playoffs == false) {

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
					var url = 'http://games.espn.com/fba/scoreboard?leagueId=100660&seasonId=' + year2 + '&matchupPeriodId=' + baseball_matchup_number;

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
								if (owner_team_list.includes(baseball_team1.text()) == true) {

									// set team names
									baseball_my_team = baseball_team1.text();
									baseball_opposing_team = baseball_team2.text();
									//console.log(baseball_my_team);
									//console.log(baseball_opposing_team);

									// set and save record
									baseball_save_record = baseball_record1.text();
									//console.log(baseball_save_record);

									// find and pull opposing owner from opposing team name
									baseball_opposing_owner = owners_per_team_name_list["teams"][baseball_opposing_team]["owner"]
									//console.log(opposing_owner);

								}

								// if team2 is in owner team names list
								else if (owner_team_list.includes(baseball_team2.text()) == true) {

									// set team names
									baseball_my_team = baseball_team2.text();
									baseball_opposing_team = baseball_team1.text();
									//console.log(baseball_my_team);
									//console.log(opposing_team);		

									// set and save record
									baseball_save_record = baseball_record2.text();
									//console.log(baseball_ave_record);

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

		// if playoffs are done, don't need to scrape or process
		else {
			console.log("baseball already done");

			// tell overall complete baseball is scraped and processed
			complete();
		} // end of else if playoffs
	} // end of if season

	// if not in season, skip
	else {
		console.log("baseball not in season");
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
		pyshell.run('baseball_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			// tell overall complete function that baseball is scraped and processes
			complete();
		}) // end of pyshell
	} // end of if statement
} // end of complete function

}) // end of owner_matchups



router.get('/owner2_matchups=2015_2016', function(req, res) {

///// SET VARIABLES //////
	// Set constant variables for all sports use
	var year1 = 2015;
	var year2 = 2016;
	var owner_number = 2;

	// variables that will never change
	var complete_count = 0;
	var sports_in_season_number = 0
	var disp_football_matchups = null;
	var disp_basketball_matchups = null;
	var disp_baseball_matchups = null;

	// football variables
	var football_in_season = true;
	// full regular season = 13 matchups
	var football_completed_matchups = 13;
	var football_playoffs = true;

	// basketball variables
	var basketball_in_season = true;
	// full regular season = 18 matchups
	var basketball_completed_matchups = 18;	
	var basketball_playoffs = true;

	// baseball variables
	var baseball_in_season = true;
	// full regular season = 22 matchups
	var baseball_completed_matchups = 22;
	var baseball_playoffs = true;

	// count how many sports are in season so know when to stop in complete()
	var sports_in_season_list = [football_in_season, basketball_in_season, baseball_in_season];
	for (c = 0; c < sports_in_season_list.length; c++) {
		if (sports_in_season_list[c] == true){
			sports_in_season_number += 1;
		}
	}


///// DEFINE FUNCTIONS USED BY ALL SPORTS /////

// complete function that when all in season sports have been pulled
var complete = function() {

	// iterate once whenever an individual sport is finished pulling/scraping
	complete_count += 1;

	// once all in season sports have been pulled
	console.log("sports in season: ", sports_in_season_number)
	if (complete_count == sports_in_season_number) {
		console.log("ready to display");

		// if baseball (and therefore all sports) is in season
		if (baseball_in_season == true) {

			// pull from mongodb and display new data after python script finishes
			db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying football matchup data...")
				disp_football_matchups = docs;
				// call display to see if all finds are done
				display();
			});

			db.collection("owner" + owner_number + "_basketball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying basketball matchup data...")
				disp_basketball_matchups = docs;
				// call display to see if all finds are done
				display();
			});

			db.collection("owner" + owner_number + "_baseball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying baseball matchup data...")
				disp_baseball_matchups = docs;
				// call display to see if all finds are done
				display();
			});			
		}

		// if basketball (and therefore football) is in season
		else if (basketball_in_season == true) {
			// pull from mongodb and display new data after python script finishes
			db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying football matchup data...")
				disp_football_matchups = docs;
				// call display to see if all finds are done
				display();
			});

			db.collection("owner" + owner_number + "_basketball_matchups_" + year2).find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying basketball matchup data...")
				disp_basketball_matchups = docs;
				// call display to see if all finds are done
				display();
			});
		}

		else {
			// pull from mongodb and display new data after python script finishes
			db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, docs) {
				//console.log(docs);
				console.log("Displaying football matchup data...")
				disp_football_matchups = docs;
				// call display to see if all finds are done
				display();
			});
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

			// if playoffs are true (season over), don't need to recalculate matchups, just pull
			if (baseball_playoffs == true) {
				// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying Trifecta owner matchups...");
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
				pyshell.run('owner_matchups.py', options, function(err) {
					if (err) throw err;
					console.log("owner matchup python script complete");

					// read total trifecta season matchup collection
					db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
						console.log("Displaying Trifecta owner matchups...");
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

			// run owner mathups python script to calculate owner matchup stats
			pyshell.run('owner_matchups.py', options, function(err) {
				if (err) throw err;
				console.log("owner matchup python script complete");

				// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying trifecta owner matchups...");
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
	} // end of if basketball in season

	// if just football is in season
	else {

		// if necessary matchup docuements are filled
		if (disp_football_matchups != null) {

			// set python arguments
			var options = {
				args: [owner_number, year1, year2, football_in_season, basketball_in_season, baseball_in_season]
			}			
			
			// run owner matchup python script to calculate owner matchup data
			pyshell.run('owner_matchups.py', options, function(err) {
				if (err) throw err;
				console.log("owner matchup python script complete");

					// read total trifecta season matchup collection
				db.collection('owner' + owner_number + '_trifecta_matchups_' + year1 + '_' + year2).find({}, {"_id": 0}).sort({"total_win_per": -1}).toArray(function(e, docs) {
					console.log("Displaying Trifecta owner matchups...");
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
	} // end of if just football in season

	
} // end of display function definition

///// EXECUTE SCRIPT /////

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

		// if football is not in playoffs (aka in regular season), SCRAPE
		if (football_playoffs == false) {

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
								if (owner_team_list.includes(football_team1) == true) {

									// set team names
									football_my_team = football_team1;
									football_opposing_team = football_team2;
									//console.log(football_my_team);
									//console.log(football_pposing_team);

									// set points for and against
									PF = parseFloat(football_score1.text()).toFixed(1);
									PA = parseFloat(football_score2.text()).toFixed(1);

									// find opposing owner per opposing team
									football_opposing_owner = owners_per_team_name_list["teams"][football_opposing_team]["owner"]
									//console.log(football_opposing_owner);
								}

								// if team2 is in list of teams of the owner
								else if (owner_team_list.includes(football_team2) == true) {
									football_my_team = football_team2;

									//set team names
									football_opposing_team = football_team1;
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

		// if playoffs are over (true), then srape already done, skip straight to displaying
		else {
			console.log("football already done");

			// tell overall complete that football scraping and processing is done 
			complete();
		} // end of else playoffs

	} // end of if in season

	// if football is not in season (not started yet), so just skip, do nothing
	else {
		console.log("football not in season")
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
		pyshell.run('football_matchups.py', options, function(err) {
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

		// if playoffs are false (aka regular season), need to SCRAPE
		if (basketball_playoffs == false) {

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
								if (owner_team_list.includes(basketball_team1.text()) == true) {

									// set team names
									basketball_my_team = basketball_team1.text();
									basketball_opposing_team = basketball_team2.text();
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
								else if (owner_team_list.includes(basketball_team2.text()) == true) {

									// set team names
									basketball_my_team = basketball_team2.text();
									basketball_opposing_team = basketball_team1.text();
									//console.log(basketball_my_team);
									//console.log(opposing_team);		

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

		// if playoffs are complete, so scrape is already 
		else {
			console.log("basketball already done");

			// tell overall complete function that basketball scrape and processing is already done
			complete();
		} // end of else if playoffs
	} // end of if season

	// if not in season, skip
	else {
		console.log("basketball not in season")
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
		pyshell.run('basketball_matchups.py', options, function(err) {
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

		// if baseball playoffs are not done yet, so still in regular season
		if (baseball_playoffs == false) {

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
					var url = 'http://games.espn.com/fba/scoreboard?leagueId=100660&seasonId=' + year2 + '&matchupPeriodId=' + baseball_matchup_number;

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
								if (owner_team_list.includes(baseball_team1.text()) == true) {

									// set team names
									baseball_my_team = baseball_team1.text();
									baseball_opposing_team = baseball_team2.text();
									//console.log(baseball_my_team);
									//console.log(baseball_opposing_team);

									// set and save record
									baseball_save_record = baseball_record1.text();
									//console.log(baseball_save_record);

									// find and pull opposing owner from opposing team name
									baseball_opposing_owner = owners_per_team_name_list["teams"][baseball_opposing_team]["owner"]
									//console.log(opposing_owner);

								}

								// if team2 is in owner team names list
								else if (owner_team_list.includes(baseball_team2.text()) == true) {

									// set team names
									baseball_my_team = baseball_team2.text();
									baseball_opposing_team = baseball_team1.text();
									//console.log(baseball_my_team);
									//console.log(opposing_team);		

									// set and save record
									baseball_save_record = baseball_record2.text();
									//console.log(baseball_ave_record);

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

		// if playoffs are done, don't need to scrape or process
		else {
			console.log("baseball already done");

			// tell overall complete baseball is scraped and processed
			complete();
		} // end of else if playoffs
	} // end of if season

	// if not in season, skip
	else {
		console.log("baseball not in season");
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
		pyshell.run('baseball_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			// tell overall complete function that baseball is scraped and processes
			complete();
		}) // end of pyshell
	} // end of if statement
} // end of complete function

}) // end of owner_matchups