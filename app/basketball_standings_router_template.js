///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

module.exports = function(req, res, db, year, playoffs) {

	var sport = "basketball";

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
				    	//console.log("Document 2 was inserted into the collection");
				    
				    	///// return callback after 2nd (innermost async) document is uploaded ///// 
				    	callback(result);
					});

					// assert to make sure no error
			    	assert.equal(err, null);
			    	//console.log("Document 1 was inserted into the collection");
			    
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

						var playoff_scrape = require('./playoffs_router_template.js')(req, res, db, sport, year, function(err, call) {
							
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
						})

					}

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
					}				

				}); // end of pyshell 
			}); // end of insertDocument 

		} // end of if(!error)
	}) // end of request
} // end of .get('/basketball_standings')