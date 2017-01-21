// route to /football_standings
router.get('/football_standings=playoff', function(req, res) {
	var year = 2016;

	;
	// url for football standings
	var url = 'http://games.espn.com/ffl/h2hplayoffs?leagueId=154802&seasonId=' + year;

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// send html page back
			//res.sendFile(path.join(__dirname, "../baseball_standings.html"));

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			// initialize variables that will be used in scrape later
			var bracket, team1, score1, team2, score2, winner


			// scraping h2h records and standings
			// for each team row in the h2h standings

			$("tr[class=tableHead]").each(function(i, element) {

				console.log($(this).children().first().text());

				// store sraped data for each team in json
				var json1 = {
					bracket: "",
					team1: "",
					score1: "",
					team2: "",
					score2: "",
					winner: "",
				};
/*
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
*/				
			});
			//console.log(h2h_standings);
/*
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

			// run standings.py from python-shell to update collections with roto and trifecta points
			pyshell.run("football_standings.py", function(err) {
				
				if (err) throw err;
				console.log("Python script complete");

				// initialize display database queries
				var disp_h2h_standings = null;

				// pull from mongodb and display new data after python script finishes
				db.collection('football_h2h_' + year).find({}, {"_id": 0}).sort({"trifecta_points": -1}).toArray(function(e, docs) {
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
							h2h_standings: disp_h2h_standings,
							year: year
						});
					}
				}


			});

		});
*/
		} // end of if(!error)
	}) // end of request
}); // end of .get('/foottball_standings')
