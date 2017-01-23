// TEMPLATE TO GET PLAYOFF RESULTS AND TRIFECTA POINTS
router.get('/football_standings=playoffs', function(req, res) {

	// pull team names to initialize football playoffs database
	db.collection('football_h2h_' + year).find({}, {"team": 1, "_id": 0}).toArray(function(e, docs) {

		var team_list = docs;
		console.log(team_list);

		// clear football playoffs database
		db.collection('football_playoffs_' + year).remove({});

		for (i = 0; i < team_list.length; i ++) {
			db.collection('football_playoffs_' + year).insert({"team": team_list[i]["team"], "playoff_trifecta_points": 0});
		}
	})

	// url for fball playoffs
	var url = 'http://games.espn.com/ffl/h2hplayoffs?leagueId=154802&seasonId=' + year;

	// url for bball
	//var url = 'http://games.espn.com/fba/h2hplayoffs?leagueId=100660&seasonId=' + year;

	// url for bsball
	//var url = 'http://games.espn.com/flb/h2hplayoffs?leagueId=109364&seasonId=' + year;

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			// initialize variables that will be used in scrape later
			var bracket, team1, score1, seed1, team2, score2, seed2, winner

			// initialize full list of playoff winners
			var playoff_winners = [];

			// scrape playoff matchups
			$("tr[class=tableHead]").each(function(i, element) {

				// check whether winner's or loser's bracket
				bracket = $(this).children().first().text();

				if (bracket === "WINNER'S BRACKET") {

					// each row of playoff bracket (works for all 6 team playoff formats)
					row1 = $(this).next().next().children().children();
					row1.each(function(j, elem) {

						// assign names, scores and seeds for each team

						team1 = $(this).children().first().next().children().first();
						//console.log(team1.text());
						score1 = team1.next();
						//console.log(score1.text());
						seed1 = team1.text().slice(1, 2);
						//console.log(seed1);

						team2 = $(this).children().first().next().next().children().first();
						//console.log(team2.text());
						score2 = team2.next();
						//console.log(score2.text());
						seed2 = team2.text().slice(1, 2);
						//console.log(seed2);						
						
						// if a BYE skip for counting playoff trifecta points
						if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
						}
						else {
							// check who wins the matchup
							if (parseFloat(score1.text()) > parseFloat(score2.text())) {
								winner = team1.text();
							}
							else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
								winner = team2.text();
							}
							// if there is a tie, lower seed wins
							else {
								if (parseInt(seed1) < parseInt(seed2)) {
									winner = team1.text();
								}
								else {
									winner = team2.text();
								}
							}
							// remove seed from team name for winner and add to list of playoff winners
							winner = winner.slice(3);
							playoff_winners.push(winner);
						}

						// if the last round (3rd iteration of first row (j=2), winner gets two wins)
						if (j === 2) {
							playoff_winners.push(winner);
						}

					}) // end of row1 iteration

					row2 = $(this).next().next().next().children().children();
					row2.each(function(j, elem) {

						// initialize name, score and seed for each team

						team1 = $(this).children().first().next().children().first();
						//console.log(team1.text());
						score1 = team1.next();
						//console.log(score1.text());
						seed1 = team1.text().slice(1, 2);
						//console.log(seed1);

						team2 = $(this).children().first().next().next().children().first();
						//console.log(team2.text());
						score2 = team2.next();
						//console.log(score2.text());
						seed2 = team2.text().slice(1, 2);
						//console.log(seed2);						
						
						// if BYE, skip
						if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
						}
						else {
							// check who wins
							if (parseFloat(score1.text()) > parseFloat(score2.text())) {
								winner = team1.text();
							}
							else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
								winner = team2.text();
							}
							else {
							// if tied, lower seed wins
								if (parseInt(seed1) < parseInt(seed2)) {
									winner = team1.text();
								}
								else {
									winner = team2.text();
								}
							}
							// slice seed off of winner and add to winner list
							winner = winner.slice(3);
							playoff_winners.push(winner);							
						}

						// if last round, add championship winner twice
						if (j === 2) {
							playoff_winners.push(winner);
						}

					}) // end of row2 iteration

					row3 = $(this).next().next().next().next().children().children();
					row3.each(function(j, elem) {

						// initialize name, score, and seed for each team

						team1 = $(this).children().first().next().children().first();
						//console.log(team1.text());
						score1 = team1.next();
						//console.log(score1.text());
						seed1 = team1.text().slice(1, 2);
						//console.log(seed1);

						team2 = $(this).children().first().next().next().children().first();
						//console.log(team2.text());
						score2 = team2.next();
						//console.log(score2.text());
						seed2 = team2.text().slice(1, 2);
						//console.log(seed2);						
						
						// if BYE, no playoff points awarded
						if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
						}
						else {
							// check to see who wins
							if (parseFloat(score1.text()) > parseFloat(score2.text())) {
								winner = team1.text();
							}
							else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
								winner = team2.text();
							}
							else {
								// if tied, lower seed wins
								if (parseInt(seed1) < parseInt(seed2)) {
									winner = team1.text();
								}
								else {
									winner = team2.text();
								}
							}
							// slice seed off of team name and push to playoff winner's list
							winner = winner.slice(3);
							playoff_winners.push(winner);							
						}

						// if 3rd iteration, last round, add again to playoff winner's list
						if (j === 2) {
							playoff_winners.push(winner);
						}

					}) // end of row3 iteration
					// can skip row 4 because just a bye

				} // END OF WINNER'S BRACKET

				// scrape for getting 1 winner of consolation bracket
				else if (bracket === "CONSOLATION LADDER") {
					
					losers_bracket = $(this).next().next().children().next().next().children().children();
					//console.log(losers_bracket.text());

					team1 = losers_bracket.first().next().children().first();
					//console.log(team1.text());
					score1 = team1.next();
					//console.log(score1.text());
					// check to see if seed is #10 (for slicing reasons)
					if (team1.text().slice(2,3) === "0") {
						seed1 = team1.text().slice(1,3);
					}
					else {
						seed1 = team1.text().slice(1, 2);
					}
					//console.log(seed1);				
					
					team2 = losers_bracket.first().next().next().children().first();
					//console.log(team2.text());
					score2 = team2.next();
					//console.log(score2.text());
					// check to see if seed is #10 (for slicing reasons)
					if (team2.text().slice(2,3) === "0") {
						seed2 = team2.text().slice(1,3);
					}
					else {
						seed2 = team2.text().slice(1, 2);
					}
					//console.log(seed2);

					// if BYE, no points awarded (reuse from winner's bracket)
					if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
					}
					else {
						// check to see who wins
						if (parseFloat(score1.text()) > parseFloat(score2.text())) {
							winner = team1.text();
							// depending on seed of winner, slice appropriately
							if (seed1 === "10") {
								winner = winner.slice(4);
							}
							else {
								winner = winner.slice(3);
							}
						}
						else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
							winner = team2.text();
							// depending on seed of winner, slice appropriately
							if (seed2 === "10") {
								winner = winner.slice(4);
							}
							else {
								winner = winner.slice(3);
							}
						}
						else {
							// if tied, lower seed wins
							if (parseInt(seed1) < parseInt(seed2)) {
								winner = team1.text();
								// depending on seed of winner, slice appropriately
								if (seed1 === "10") {
									winner = winner.slice(4);
								}
								else {
									winner = winner.slice(3);
								}
							}
							else {
								winner = team2.text();
								// depending on seed of winner, slice appropriately
								if (seed2 === "10") {
									winner = winner.slice(4);
								}
								else {
									winner = winner.slice(3);
								}
							}
						}
					}
					// add consolation bracket winner to playoff winner's list
					playoff_winners.push(winner);

				} // end of CONSOLATION LADDER
				
			});  // end of scrape (tableHead iteration)

			//console.log(playoff_winners);

			// initialize upload object
			var playoff_winners_upload = {};

			// loop through playoff winners list
			for (i = 0; i < playoff_winners.length; i++) {
				winning_team = playoff_winners[i];
				var playoff_wins = 0;

				// loop through to count number of times a team wins
				for (j = 0; j < playoff_winners.length; j++) {

					if (winning_team === playoff_winners[j]) {
						playoff_wins += 1
					}
				}
				var disp_playoff_standings = null;

				// add to football playoffs database and regex takes care of half names that playoff bracket sometimes gives
				db.collection('football_playoffs_' + year).update({"team": { "$regex": winning_team}}, {"$set": {"playoff_trifecta_points": playoff_wins}}, function(err, result) {

					console.log("updated database");

				})
			}

		} // end of if(!error)
	}) // end of request
}); // end of .get('/football_playoffs')