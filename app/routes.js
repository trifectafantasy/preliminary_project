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

// set current years to test against
var current_year1 = 2016;
var current_year2 = 2017;

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
			// full regular season = 22 matchups
			var baseball_completed_matchups = 1;
			var baseball_playoffs = false;

			// call matchups.js with all the necessary arguments
			var match = require('./matchups.js')(req, res, db, owner_number, year1, year2, football_in_season, football_completed_matchups, football_playoffs, basketball_in_season, basketball_completed_matchups, basketball_playoffs, baseball_in_season, baseball_completed_matchups, baseball_playoffs);
		}
		// if the years given are in the past, set everything as finished (true, max, true)
		else if (year1 < current_year1 && year2 < current_year2) {
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
			var match = require('./matchups.js')(req, res, db, owner_number, year1, year2, football_in_season, football_completed_matchups, football_playoffs, basketball_in_season, basketball_completed_matchups, basketball_playoffs, baseball_in_season, baseball_completed_matchups, baseball_playoffs);
		}
		// handle error case if years are greater than current
		else {
			var disp_err = "Please enter years " + current_year1 + " & " + current_year2 + " or less";
			res.send(disp_err);
		}
	}

}); // end of owner to owner matchups 


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
	var year = req.params.year;
	var playoffs = true;

	if (year <= 2016) {
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
	} // end of if <= 2016 (aka, don't need to srape anymore)

	else {
			var stand = require('./football_standings_router_template.js')(req, res, db, year, playoffs);

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


