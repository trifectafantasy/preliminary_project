// TEMPLATE TO GET PLAYOFF RESULTS AND TRIFECTA POINTS
router.get('/baseball_standings=playoffs', function(req, res) {
	var year = 2016;

	db.collection('baseball_h2h_' + year).find({}, {"team": 1, "_id": 0}).toArray(function(e, docs) {

		var team_list = docs;
		console.log(team_list);

		db.collection('baseball_playoffs_' + year).remove({});

		for (i = 0; i < team_list.length; i ++) {
			db.collection('baseball_playoffs_' + year).insert({"team": team_list[i]["team"], "playoff_trifecta_points": 0});
		}
	})

	// url for baseball standings
	var url = 'http://games.espn.com/flb/h2hplayoffs?leagueId=109364&seasonId=' + year;

	request(url, function(error, response, html) {

		// if not an error
		if(!error){

			// send html page back
			//res.sendFile(path.join(__dirname, "../baseball_standings.html"));

			// use cheerio to traverse and scrape html 
			var $ = cheerio.load(html);

			// initialize variables that will be used in scrape later
			var bracket, team1, score1, seed1, team2, score2, seed2, winner
			var playoff_winners = [];

			// scrape playoff matchups
			$("tr[class=tableHead]").each(function(i, element) {


				bracket = $(this).children().first().text();

				if (bracket === "WINNER'S BRACKET") {

					row1 = $(this).next().next().children().children();

					row1.each(function(j, elem) {

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
						
						if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
						}
						else {
							if (parseFloat(score1.text()) > parseFloat(score2.text())) {
								winner = team1.text();
							}
							else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
								winner = team2.text();
							}
							else {
								if (parseInt(seed1) < parseInt(seed2)) {
									winner = team1.text();
								}
								else {
									winner = team2.text();
								}
							}
							winner = winner.slice(3);
							playoff_winners.push(winner);
						}

						if (j === 2) {
							playoff_winners.push(winner);
						}

					}) // end of row1 iteration

					row2 = $(this).next().next().next().children().children();

					row2.each(function(j, elem) {

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
						
						if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
						}
						else {
							if (parseFloat(score1.text()) > parseFloat(score2.text())) {
								winner = team1.text();
							}
							else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
								winner = team2.text();
							}
							else {
								if (parseInt(seed1) < parseInt(seed2)) {
									winner = team1.text();
								}
								else {
									winner = team2.text();
								}
							}
							winner = winner.slice(3);
							playoff_winners.push(winner);							
						}

						if (j === 2) {
							playoff_winners.push(winner);
						}

					}) // end of row1 iteration

					row3 = $(this).next().next().next().next().children().children();
					//console.log(row3.text());

					row3.each(function(j, elem) {

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
						
						if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
						}
						else {
							if (parseFloat(score1.text()) > parseFloat(score2.text())) {
								winner = team1.text();
							}
							else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
								winner = team2.text();
							}
							else {
								if (parseInt(seed1) < parseInt(seed2)) {
									winner = team1.text();
								}
								else {
									winner = team2.text();
								}
							}
							winner = winner.slice(3);
							playoff_winners.push(winner);							
						}

						if (j === 2) {
							playoff_winners.push(winner);
						}

					}) // end of row1 iteration
					// can skip row 4 because just a bye

				} // END OF WINNER'S BRACKET
				else if (bracket === "CONSOLATION LADDER") {
					
					losers_bracket = $(this).next().next().children().next().next().children().children();
					//console.log(losers_bracket.text());

					team1 = losers_bracket.first().next().children().first();
					//console.log(team1.text());
					score1 = team1.next();
					//console.log(score1.text());
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
					if (team2.text().slice(2,3) === "0") {
						seed2 = team2.text().slice(1,3);
					}
					else {
						seed2 = team2.text().slice(1, 2);
					}
					//console.log(seed2);

					if (team1.text() === "*BYE*" || team2.text() === "*BYE*"){
							//console.log("Bye");
					}
					else {
						if (parseFloat(score1.text()) > parseFloat(score2.text())) {
							winner = team1.text();
							if (seed1 === "10") {
								winner = winner.slice(4);
							}
							else {
								winner = winner.slice(3);
							}
							
						}
						else if (parseFloat(score1.text()) < parseFloat(score2.text())) {
							winner = team2.text();
							if (seed2 === "10") {
								winner = winner.slice(4);
							}
							else {
								winner = winner.slice(3);
							}
							
						}
						else {
							if (parseInt(seed1) < parseInt(seed2)) {
								winner = team1.text();
								if (seed1 === "10") {
									winner = winner.slice(4);
								}
								else {
									winner = winner.slice(3);
								}
								
							}
							else {
								winner = team2.text();
								if (seed2 === "10") {
									winner = winner.slice(4);
								}
								else {
									winner = winner.slice(3);
								}
								
							}
						}
					}

					playoff_winners.push(winner);

				} // end of CONSOLATION LADDER
				
			});  // end of tableHead iteration

			//console.log(playoff_winners);

			var playoff_winners_upload = {};

			for (i = 0; i < playoff_winners.length; i++) {
				winning_team = playoff_winners[i];
				var playoff_wins = 0;

				for (j = 0; j < playoff_winners.length; j++) {

					if (winning_team === playoff_winners[j]) {
						playoff_wins += 1
					}
				}

				var disp_playoff_standings = null;

				db.collection('baseball_playoffs_' + year).update({"team": { "$regex": winning_team}}, {"$set": {"playoff_trifecta_points": playoff_wins}}, function(err, result) {

					console.log("updated database");

				})
			}

		} // end of if(!error)
	}) // end of request
}); // end of .get('/football_standings')