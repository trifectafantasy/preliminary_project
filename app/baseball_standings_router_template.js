// route to /baseball_standings
router.get('/baseball_standings=____', function(req, res) {
	var year = ____;
	// url for baseballf standings
	var url = 'http://games.espn.com/flb/standings?leagueId=109364&seasonId=' + year;

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
			var insertDocument = function(db, year, callback) {

				// set collections
				var collection1 = db.collection('baseball_h2h' + year);
				var collection2 = db.collection('baseball_roto' + year);

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

			var options = {
				args: [year]
			}

			// run standings.py from python-shell to update collections with roto and trifecta points
			pyshell.run("baseball_standings.py", options, function(err) {
				
				if (err) throw err;
				console.log("Python script complete");

				// initialize display database queries
				var disp_h2h_standings = null;
				var disp_roto_standings = null;

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

				// function that checks if both finds from mongodb are complete (ie display variables are not empty)
				var complete = function() {
					if (disp_h2h_standings !== null && disp_roto_standings !== null) {

						// render to baseball_standings
						res.render('baseball_standings', {
							h2h_standings: disp_h2h_standings,
							roto_standings: disp_roto_standings,
							year: year
						});
					}
				}


			});

		});


		} // end of if(!error)
	}) // end of request
}) // end of .get('/baseball_standings')