
router.get('/owner2_football_matchups=2016_2017', function(req, res) {
	var year1 = 2016;
	var year2 = 2017;
	var owner_number = 2;
	var football_iterate_complete = 0;

	// full regular season = 13 matchups
	var football_completed_matchups = 13;

	db.collection("owners_per_team_name").find({}, {"_id": 0}).toArray(function(e, docs2) {
		owners_per_team_name_list = docs2[0];
	});

	db.collection("owner" + owner_number + "_football_matchups_scrape_" + year1).remove({})

	db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"];
		//console.log(owner_name);
		owner_team_list = docs[0]["teams"];
		//console.log(owner_team_list);

		var football_team1, football_score1, football_team2, football_score2, football_opposing_owner, football_my_team, football_opposing_team
		var football_wins, football_losses, football_ties, PF, PA, pt_diff
		//var football_matchup_number = 1

		for (football_matchup_number = 1; football_matchup_number < football_completed_matchups + 1; football_matchup_number++) {

			var url = 'http://games.espn.com/ffl/scoreboard?leagueId=154802&seasonId=' + year1 + '&matchupPeriodId=' + football_matchup_number;

			request(url, function(error, response, html) {

				// if not an error
				if(!error){

					// use cheerio to traverse and scrape html 
					var $ = cheerio.load(html);

					$('table.ptsBased.matchup').each(function(j, element) {

						football_wins = 0;
						football_losses = 0;
						football_ties = 0;
						PF = 0;
						PA = 0;

						football_team1 = $(this).children().first().children().children().first();
						var paren1 = football_team1.text().indexOf("(");
						football_team1 = football_team1.text().slice(0, paren1 - 1);
						//console.log(football_team1);
						football_score1 = $(this).children().first().children().next();
						//console.log(football_score1.text());

						football_team2 = $(this).children().next().children().children().first();
						var paren2 = football_team2.text().indexOf("(");
						football_team2 = football_team2.text().slice(0, paren2 - 1);
						//console.log(football_team2);
						score2 = $(this).children().next().children().next();
						//console.log(football_score2.text());

						if (owner_team_list.includes(football_team1) == true) {
							football_my_team = football_team1;
							football_opposing_team = football_team2;
							//console.log(football_my_team);
							//console.log(football_pposing_team);
							PF = parseFloat(football_score1.text()).toFixed(1);
							PA = parseFloat(football_score2.text()).toFixed(1);
							football_opposing_owner = owners_per_team_name_list["teams"][football_opposing_team]["owner"]
							//console.log(football_opposing_owner);

						}
						else if (owner_team_list.includes(football_team2) == true) {
							football_my_team = football_team2;
							football_opposing_team = football_team1;
							//console.log(football_my_team);
							//console.log(football_opposing_team);		
							PF = parseFloat(football_score2.text()).toFixed(1);
							PA = parseFloat(football_score1.text()).toFixed(1);
							opposing_owner = owners_per_team_name_list["teams"]football_opposing_team]["owner"]
							//console.log(football_opposing_owner);

						}
						if (PF != 0 && PA != 0) {
							db.collection('owner' + owner_number + "_football_matchups_scrape_" + year1).insert({"opposing_owner": football_opposing_owner, "PF": PF, "PA": PA})
							complete();
						}
						
					}) // end of table.ptsBased.matchup iteration
				} // end of if(!error)
			}) // end of request
		} // end of for loop



	}) // end of owner team collection

var complete = function() {
	football_iterate_complete += 1;
	if (football_iterate_complete === football_ompleted_matchups) {
		console.log("scraping done");

		var options = {
			args: [owner_number, year1]
		}

		pyshell.run('football_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			db.collection('owner' + owner_number + '_football_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, display_docs) {
				//console.log(display_docs);
				var disp_matchup_standings = display_docs
				console.log("Displaying matchup data...");
				res.render('football_matchups', {
					year: year1,
					owner: owner_name,
					matchup_standings: disp_matchup_standings
				})
			}) // display and render data
		}) // end of pyshell

	} // end of if statement
	
} // end of complete function


	var year1 = 2015;
	var year2 = 2016;
	var owner_number = 2;
	var iterate_complete = 0;

	// full regular season = 22 matchups
	var completed_matchups = 22;

	db.collection("owners_per_team_name").find({}, {"_id": 0}).toArray(function(e, docs2) {
		owners_per_team_name_list = docs2[0];
		//console.log(owners_per_team_name_list);
	});

	db.collection("owner" + owner_number + "_baseball_matchups_scrape_" + year2).remove({})

	db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"];
		//console.log(owner_name);
		owner_team_list = docs[0]["teams"];
		//console.log(owner_team_list);

		var team1, score1, team2, score2, opposing_owner, path, my_team, opposing_team
		var record1, record2, save_record
		//var matchup_number = 1

		for (matchup_number = 1; matchup_number < completed_matchups + 1; matchup_number++) {


			var url = 'http://games.espn.com/flb/scoreboard?leagueId=109364&seasonId=' + year2 + '&matchupPeriodId=' +matchup_number;

			request(url, function(error, response, html) {

				// if not an error
				if(!error){

					// use cheerio to traverse and scrape html 
					var $ = cheerio.load(html);

					$('tr.tableSubHead').each(function(j, element) {

						save_record = null;

						team1 = $(this).next().children().children().first();
						//console.log(team1.text());

						record1 = $(this).next().children().last().children();
						//console.log(record1.text());

						team2 = $(this).next().next().children().children().first();
						//console.log(team2.text());

						record2 = $(this).next().next().children().last().children();
						//console.log(record2.text());


						if (owner_team_list.includes(team1.text()) == true) {
							my_team = team1.text();
							opposing_team = team2.text();
							//console.log(my_team);
							//console.log(opposing_team);
							save_record = record1.text();
							//console.log(save_record);
							opposing_owner = owners_per_team_name_list["teams"][opposing_team]["owner"]
							//console.log(opposing_owner);

						}
						else if (owner_team_list.includes(team2.text()) == true) {
							my_team = team2.text();
							opposing_team = team1.text();
							//console.log(my_team);
							//console.log(opposing_team);		
							save_record = record2.text();
							//console.log(save_record);
							opposing_owner = owners_per_team_name_list["teams"][opposing_team]["owner"]
							//console.log(opposing_owner);

						}
						if (save_record != null) {
							db.collection('owner' + owner_number + "_baseball_matchups_scrape_" + year2).insert({"opposing_owner": opposing_owner, "record": save_record})
							complete();
						}
						
					}) // end of table.ptsBased.matchup iteration
				} // end of if(!error)
			}) // end of request
		} // end of for loop



	}) // end of owner team collection

var complete = function() {
	iterate_complete += 1;
	if (iterate_complete === completed_matchups) {
		console.log("scraping done");

		var options = {
			args: [owner_number, year2]
		}

		pyshell.run('baseball_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			db.collection('owner' + owner_number + '_baseball_matchups_' + year2).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, display_docs) {
				//console.log(display_docs);
				var disp_matchup_standings = display_docs
				console.log("Displaying matchup data...");
				res.render('baseball_matchups', {
					year: year2,
					owner: owner_name,
					matchup_standings: disp_matchup_standings
				})
			}) // display and render data
		}) // end of pyshell

	} // end of if statement
	
} // end of complete function

	var year1 = 2016;
	var year2 = 2017;
	var owner_number = 2;
	var iterate_complete = 0;

	// full regular season = 22 matchups
	var completed_matchups = 13;

	db.collection("owners_per_team_name").find({}, {"_id": 0}).toArray(function(e, docs2) {
		owners_per_team_name_list = docs2[0];
		//console.log(owners_per_team_name_list);
	});

	db.collection("owner" + owner_number + "_basketball_matchups_scrape_" + year2).remove({})

	db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"];
		//console.log(owner_name);
		owner_team_list = docs[0]["teams"];
		//console.log(owner_team_list);

		var team1, score1, team2, score2, opposing_owner, path, my_team, opposing_team
		var record1, record2, save_record
		//var matchup_number = 1

		for (matchup_number = 1; matchup_number < completed_matchups + 1; matchup_number++) {


			var url = 'http://games.espn.com/fba/scoreboard?leagueId=100660&seasonId=' + year2 + '&matchupPeriodId=' + matchup_number;

			request(url, function(error, response, html) {

				// if not an error
				if(!error){

					// use cheerio to traverse and scrape html 
					var $ = cheerio.load(html);

					$('tr.tableSubHead').each(function(j, element) {

						save_record = null;

						team1 = $(this).next().children().children().first();
						//console.log(team1.text());

						record1 = $(this).next().children().last().children();
						//console.log(record1.text());

						team2 = $(this).next().next().children().children().first();
						//console.log(team2.text());

						record2 = $(this).next().next().children().last().children();
						//console.log(record2.text());


						if (owner_team_list.includes(team1.text()) == true) {
							my_team = team1.text();
							opposing_team = team2.text();
							console.log(my_team);
							//console.log(opposing_team);
							save_record = record1.text();
							console.log(save_record);
							opposing_owner = owners_per_team_name_list["teams"][opposing_team]["owner"]
							console.log(opposing_owner);

						}
						else if (owner_team_list.includes(team2.text()) == true) {
							my_team = team2.text();
							opposing_team = team1.text();
							console.log(my_team);
							//console.log(opposing_team);		
							save_record = record2.text();
							console.log(save_record);
							opposing_owner = owners_per_team_name_list["teams"][opposing_team]["owner"]
							console.log(opposing_owner);

						}
						if (save_record != null) {
							db.collection('owner' + owner_number + "_basketball_matchups_scrape_" + year2).insert({"opposing_owner": opposing_owner, "record": save_record})
							complete();
						}
						
					}) // end of table.ptsBased.matchup iteration
				} // end of if(!error)
			}) // end of request
		} // end of for loop



	}) // end of owner team collection

var complete = function() {
	iterate_complete += 1;
	if (iterate_complete === completed_matchups) {
		console.log("scraping done");

		var options = {
			args: [owner_number, year2]
		}

		pyshell.run('basketball_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			db.collection('owner' + owner_number + '_basketball_matchups_' + year2).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, display_docs) {
				//console.log(display_docs);
				var disp_matchup_standings = display_docs
				console.log("Displaying matchup data...");
				res.render('basketball_matchups', {
					year: year2,
					owner: owner_name,
					matchup_standings: disp_matchup_standings
				})
			}) // display and render data
		}) // end of pyshell

	} // end of if statement
	
} // end of complete function

}) // end of get(/ownerX_matchups=2016_2017)