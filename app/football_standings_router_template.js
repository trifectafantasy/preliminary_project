///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

module.exports = function(req, res, db, year, playoffs) {

	var sport = 'football';

	// url for football standings
	var url = 'http://games.espn.com/ffl/standings?leagueId=154802&seasonId=' + year;

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

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
				
			}); // end of each h2h row
			//console.log(h2h_standings);

			// scrape for PF and PA for every other team
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
			}); // end of each even row

			// scrape for PF and PA for every other team
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
			}); // end of each odd row

			//console.log(other_standings);

			///// DEFINE FUNCTIONS (so far still only defined inside the request) ///// 

			// asynchronous function that inserts both arrays into their appropriate collections
			// arguments are the database (db) and callback
			var insertDocument = function(db, year, callback) {

				// set collections
				var collection1 = db.collection('football_h2h_' + year);
				var collection2 = db.collection('football_roto_' + year);

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

				var options = {
					args: [year]
				}

				// run standings.py from python-shell to update collections with roto and trifecta points
				pyshell.run("football_standings.py", options, function(err) {
					
					if (err) throw err;
					console.log("Python script complete");

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

					// if playoffs are true (playoffs are done)
					if (playoffs === true) {
						// initialize year as argument for python script
						var options = {
							args: [year]
						};

						var playoff_scrape = require('./playoffs_router_template.js')(req, res, db, sport, year, function(err, call) {
							
							// run python script to initialize trifecta database
							pyshell.run('football_playoffs.py', options, function(err) {
								if (err) throw err;
								console.log('Playoff python script complete');

								db.collection('football_trifecta_' + year).find({}, {"_id": 0}).sort({"total_trifecta_points": -1}).toArray(function(e, docs) {
									//console.log(docs);
									console.log("Displaying playoff data...");
									disp_trifecta_standings = docs;
									complete();
								});	// end of trifecta standings pull
							}) // end of pyshell
						}); // end of playoff scrape
					}; // end of if playoffs 

					// function that checks if both finds from mongodb are complete (ie display variables are not empty)
					var complete = function() {

						if (playoffs === true) {
							if (disp_h2h_standings !== null && disp_trifecta_standings !== null) {

								// render to baseball_standings
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

								// render to baseball_standings
								res.render('football_standings', {
									h2h_standings: disp_h2h_standings,
									year: year,
									playoffs: playoffs
								});
							}
						}
					} // end of complete function

				}); // end of pyshell
			}); // end of insertDocument

		} // end of if(!error)
	}) // end of request
} // end of module export