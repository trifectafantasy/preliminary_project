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
	// send response as index.html page
	//res.sendFile(path.join(__dirname, "../index.html"));
	const message = {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	}
	res.render('index', message);
});

// route to /baseball_standings
router.get('/baseball_standings', function(req, res) {

	// url for basketball 2017 standings
	//var url = 'http://games.espn.com/fba/standings?leagueId=100660&seasonId=2017';

	// url for baseball 2016 standings
	var url = 'http://games.espn.com/flb/standings?leagueId=109364&seasonId=2016';

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// send html page back
			//res.sendFile(path.join(__dirname, "../baseball_standings.html"));

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			// initialize variables that will be used in scrape later
			var division, team, wins, losses, ties, win_per
			var h2h_standings = new Array();

			var h2h_rank, team, R, HR, RBI, SO, SB, OBP, K, QS, W, SV, ERA, WHIP
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
					R: "",
					HR: "",
					RBI: "",
					SO: "",
					SB: "",
					OBP: "",
					K: "",
					QS: "",
					W: "",
					SV: "",
					ERA: "",
					WHIP: ""
				}

				// traversing DOM
				h2h_rank = $(this).children().first();
				// hitting categories
				team = h2h_rank.next();
				R = team.next().next();
				HR = R.next();
				RBI = HR.next();
				SO = RBI.next();
				SB = SO.next();
				OBP = SB.next();

				// pithing categories
				K = OBP.next().next();
				QS = K.next();
				W = QS.next();
				SV = W.next();
				ERA = SV.next();
				WHIP = ERA.next();

				// store each scraped value in json as TEXT, INT, or FLOAT
				json2.h2h_rank = parseInt(h2h_rank.text());
				json2.team = team.text();
				json2.R = parseInt(R.text());
				json2.HR = parseInt(HR.text());
				json2.RBI = parseInt(RBI.text());
				json2.SO = parseInt(SO.text());
				json2.SB = parseInt(SB.text());
				json2.OBP = parseFloat(OBP.text()).toFixed(4);

				json2.K = parseInt(K.text());
				json2.QS = parseInt(QS.text());
				json2.W = parseInt(W.text());
				json2.SV = parseInt(SV.text());
				json2.ERA = parseFloat(ERA.text()).toFixed(3);
				json2.WHIP = parseFloat(WHIP.text()).toFixed(3);

				// push each team's json of data into array of all teams
				roto_standings.push(json2);

			})
			
			//console.log(standings);
			//console.log(roto_standings);

			///// DEFINE FUNCTIONS (so far still only defined inside the request) ///// 

			// asynchronous function that inserts both arrays into their appropriate collections
			// arguments are the database (db) and callback
			var insertDocument = function(db, callback) {

				// set collections
				var collection1 = db.collection('baseball_2016_h2h');
				var collection2 = db.collection('baseball_2016_roto');

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

			// function if you want to read from mongodb
			// arugments are database (db) and callback
			var readCollection = function(db, callback) {

				// pull down all douments from each collection into a cursor (need to iterate through)
				var cursor1 = db.collection('baseball_2016_h2h').find({});
				var cursor2 = db.collection('baseball_2016_roto').find({});

				cursor1.each(function(err, doc) {
					assert.equal(err, null);
					if (doc != null) {
						console.dir(doc);
					} else {
						callback();
					}
				});

				cursor2.each(function(err, doc) {
					assert.equal(err, null);
					if (doc != null) {
						console.dir(doc);
					} else {
						callback();
					}
				});
			}

///// EXECUTE SCRIPT /////

		// call insertDocumet asynchronously, but don't use db from callback as we need to use db from argument to find and get from to render
		insertDocument(db, function(callback) {

			console.log("All documents uploaded");

			// run standings.py from python-shell to update collections with roto and trifecta points
			pyshell.run("baseball_standings.py", function(err) {
				
				if (err) throw err;
				console.log("Python script complete");

				// initialize display database queries
				var disp_h2h_standings = null;
				var disp_roto_standings = null;

				// pull from mongodb and display new data after python script finishes
				db.collection('baseball_2016_h2h').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
					//console.log(docs);
					console.log("Displaying h2h data...")
					disp_h2h_standings = docs;
					// call complete to see if both finds are done
					complete();
				});

				db.collection('baseball_2016_roto').find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
					//console.log(docs);
					console.log("Displaying roto data...")
					disp_roto_standings = docs;
					// call complete to see if both finds are done
					complete();
				});				

				// function that checks if both finds from mongodb are complete (ie display variables are not empty)
				var complete = function() {
					if (disp_h2h_standings !== null && disp_roto_standings !== null) {

						// render to baseball_standings
						res.render('baseball_standings', {
							h2h_standings: disp_h2h_standings,
							roto_standings: disp_roto_standings
						});
					}
				}


			});

		});


		} // end of if(!error)
	}) // end of request
}) // end of .get('/baseball_standings')


// route to /basketball_standings
router.get('/basketball_standings', function(req, res) {

	// url for basketball 2016 standings
	var url = 'http://games.espn.com/fba/standings?leagueId=100660&seasonId=2016';

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// send html page back
			//res.sendFile(path.join(__dirname, "../baseball_standings.html"));

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
				json1.team = team.attr('title');
				json1.wins = parseInt(wins.text());
				json1.losses = parseInt(losses.text());
				json1.ties = parseInt(ties.text());
				json1.win_per = parseFloat(win_per.text()).toFixed(3);

				// push each team's json of data into array of all teams
				h2h_standings.push(json1);
			})

			// scraping roto stats and standings
			// for each team row in roto standings (note space " " in class name; it's possible)
			$('tr.tableBody.sortableRow').each(function(i, element) {

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
					PTS: "",
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
				json2.FT_PCT = parseFloat(FT_PCT.text());
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
			var insertDocument = function(db, callback) {

				// set collections
				var collection1 = db.collection('basketball_2016_h2h');
				var collection2 = db.collection('basketball_2016_roto');

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

			// function if you want to read from mongodb
			// arugments are database (db) and callback
			var readCollection = function(db, callback) {

				// pull down all douments from each collection into a cursor (need to iterate through)
				var cursor1 = db.collection('basketball_2016_h2h').find({});
				var cursor2 = db.collection('basketball_2016_roto').find({});

				cursor1.each(function(err, doc) {
					assert.equal(err, null);
					if (doc != null) {
						console.dir(doc);
					} else {
						callback();
					}
				});

				cursor2.each(function(err, doc) {
					assert.equal(err, null);
					if (doc != null) {
						console.dir(doc);
					} else {
						callback();
					}
				});
			}

///// EXECUTE SCRIPT /////

		// call insertDocumet asynchronously, but don't use db from callback as we need to use db from argument to find and get from to render
		insertDocument(db, function(callback) {

			console.log("All documents uploaded");

			// run standings.py from python-shell to update collections with roto and trifecta points
			pyshell.run("basketball_standings.py", function(err) {
				
				if (err) throw err;
				console.log("Python script complete");

				// initialize display database queries
				var disp_h2h_standings = null;
				var disp_roto_standings = null;

				// pull from mongodb and display new data after python script finishes
				db.collection('basketball_2016_h2h').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
					//console.log(docs);
					console.log("Displaying h2h data...")
					disp_h2h_standings = docs;
					// call complete to see if both finds are done
					complete();
				});

				db.collection('basketball_2016_roto').find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
					//console.log(docs);
					console.log("Displaying roto data...")
					disp_roto_standings = docs;
					// call complete to see if both finds are done
					complete();
				});				

				// function that checks if both finds from mongodb are complete (ie display variables are not empty)
				var complete = function() {
					if (disp_h2h_standings !== null && disp_roto_standings !== null) {

						// render to baseball_standings
						res.render('basketball_standings', {
							h2h_standings: disp_h2h_standings,
							roto_standings: disp_roto_standings
						});
					}
				}


			});

		});


		} // end of if(!error)
	}) // end of request
}); // end of .get('/basketball_standings')

// route to /football_standings
router.get('/football_standings', function(req, res) {

	// url for football 2016 standings
	var url = 'http://games.espn.com/ffl/standings?leagueId=154802&seasonId=2016';

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// send html page back
			//res.sendFile(path.join(__dirname, "../baseball_standings.html"));

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			// initialize variables that will be used in scrape later
			var division, team, wins, losses, ties, win_per
			var h2h_standings = new Array();

			var PF, PA
			var other_standings = new Array();



			// scraping h2h records and standings
			// for each team row in the h2h standings

			$("tr[class=tableBody]").each(function(i, element) {

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
				
			});
			//console.log(h2h_standings);

			$('tr.evenRow.bodyCopy.sortableRow').each(function(i, element) {

				var json2 = {
					team: "",
					PF: "",
					PA: ""
				};

				team = $(this).children().children();
				PF = team.parent().next();
				PA = PF.next();

				json2.team = team.text();
				json2.PF = parseFloat(PF.text()).toFixed(1);
				json2.PA = parseFloat(PA.text()).toFixed(1);

				other_standings.push(json2);
			});

			$('tr.oddRow.bodyCopy.sortableRow').each(function(i, element) {

				var json3 = {
					team: "",
					PF: "",
					PA: ""
				};

				team = $(this).children().children();
				PF = team.parent().next();
				PA = PF.next();

				json3.team = team.text();
				json3.PF = parseFloat(PF.text()).toFixed(1);
				json3.PA = parseFloat(PA.text()).toFixed(1);

				other_standings.push(json3);
			});

			//console.log(other_standings);

			///// DEFINE FUNCTIONS (so far still only defined inside the request) ///// 

			// asynchronous function that inserts both arrays into their appropriate collections
			// arguments are the database (db) and callback
			var insertDocument = function(db, callback) {

				// set collections
				var collection1 = db.collection('football_2016_h2h');
				var collection2 = db.collection('football_2016_roto');

				// remove all documents from collections to start fresh
				collection1.remove({});
				collection2.remove({});

				///// INSERT DOCUMENTS ASYNCHRONOUSLY /////

				// insert h2h standings array 
				collection1.insert(h2h_standings, function(err, result) {

			    	// insert roto standings array
					collection2.insert(other_standings, function(err, result) {
			    		
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

			// function if you want to read from mongodb
			// arugments are database (db) and callback
			var readCollection = function(db, callback) {

				// pull down all douments from each collection into a cursor (need to iterate through)
				var cursor1 = db.collection('basketball_2016_h2h').find({});
				var cursor2 = db.collection('basketball_2016_roto').find({});

				cursor1.each(function(err, doc) {
					assert.equal(err, null);
					if (doc != null) {
						console.dir(doc);
					} else {
						callback();
					}
				});

				cursor2.each(function(err, doc) {
					assert.equal(err, null);
					if (doc != null) {
						console.dir(doc);
					} else {
						callback();
					}
				});
			}

///// EXECUTE SCRIPT /////

		// call insertDocumet asynchronously, but don't use db from callback as we need to use db from argument to find and get from to render
		insertDocument(db, function(callback) {

			console.log("All documents uploaded");

			// run standings.py from python-shell to update collections with roto and trifecta points
			pyshell.run("football_standings.py", function(err) {
				
				if (err) throw err;
				console.log("Python script complete");

				// initialize display database queries
				var disp_h2h_standings = null;

				// pull from mongodb and display new data after python script finishes
				db.collection('football_2016_h2h').find({}, {"_id": 0}).sort({"trifecta_points": -1}).toArray(function(e, docs) {
					//console.log(docs);
					console.log("Displaying h2h data...")
					disp_h2h_standings = docs;
					// call complete to see if both finds are done
					complete();
				});

				// function that checks if both finds from mongodb are complete (ie display variables are not empty)
				var complete = function() {
					if (disp_h2h_standings !== null) {

						// render to baseball_standings
						res.render('football_standings', {
							h2h_standings: disp_h2h_standings
						});
					}
				}


			});

		});

		} // end of if(!error)
	}) // end of request
}); // end of .get('/foottball_standings')
