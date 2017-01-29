
router.get('/owner2_baseball_matchups=2015_2016', function(req, res) {
	var year1 = 2015;
	var year2 = 2016;
	var owner_number = 2;
	var iterate_complete = 0;

	// full regular season = 13 matchups
	var completed_matchups = 13;

	db.collection("owners_per_team_name").find({}, {"_id": 0}).toArray(function(e, docs2) {
		owners_per_team_name_list = docs2[0];
	});

	db.collection("owner" + owner_number + "_baseball_matchups_scrape_" + year1).remove({})

	db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"];
		//console.log(owner_name);
		owner_team_list = docs[0]["teams"];
		//console.log(owner_team_list);

		var team1, score1, team2, score2, opposing_owner, path, my_team, opposing_team
		var record
		var matchup_number = 1

		//for (matchup_number = 1; matchup_number < completed_matchups + 1; matchup_number++) {


			var url = 'http://games.espn.com/flb/scoreboard?leagueId=109364&seasonId=' + year2 + '&matchupPeriodId=' +matchup_number;

			request(url, function(error, response, html) {

				// if not an error
				if(!error){

					// use cheerio to traverse and scrape html 
					var $ = cheerio.load(html);

					$('tr.tableSubHead').each(function(j, element) {

						record = "";

						team1 = $(this).next().children();
						//var paren1 = team1.text().indexOf("(");
						//team1 = team1.text().slice(0, paren1 - 1);
						console.log(team1.text());

						//team2 = $(this).children().next().children().children().first();
						//var paren2 = team2.text().indexOf("(");
						//team2 = team2.text().slice(0, paren2 - 1);
						//console.log(team2.text());
/*
						if (owner_team_list.includes(team1) == true) {
							my_team = team1;
							opposing_team = team2;
							//console.log(my_team);
							//console.log(opposing_team);
							PF = parseFloat(score1.text()).toFixed(1);
							PA = parseFloat(score2.text()).toFixed(1);
							opposing_owner = owners_per_team_name_list["teams"][opposing_team]["owner"]
							//console.log(opposing_owner);

						}
						else if (owner_team_list.includes(team2) == true) {
							my_team = team2;
							opposing_team = team1;
							//console.log(my_team);
							//console.log(opposing_team);		
							PF = parseFloat(score2.text()).toFixed(1);
							PA = parseFloat(score1.text()).toFixed(1);
							opposing_owner = owners_per_team_name_list["teams"][opposing_team]["owner"]
							//console.log(opposing_owner);

						}
						if (PF != 0 && PA != 0) {
							db.collection('owner' + owner_number + "_baseball_matchups_scrape_" + year1).insert({"opposing_owner": opposing_owner, "PF": PF, "PA": PA})
							complete();
						}
*/						
					}) // end of table.ptsBased.matchup iteration
				} // end of if(!error)
			}) // end of request
		//} // end of for loop



	}) // end of owner team collection

var complete = function() {
	iterate_complete += 1;
	if (iterate_complete === completed_matchups) {
		console.log("scraping done");

		var options = {
			args: [owner_number, year1]
		}

		pyshell.run('baseball_matchups.py', options, function(err) {
			if (err) throw err;
			console.log('Matchups python script complete');

			db.collection('owner' + owner_number + '_baseball_matchups_' + year1).find({}, {"_id": 0}, {"sort": [["win_per", "desc"], ["pt_diff", "desc"]]}).toArray(function(e, display_docs) {
				//console.log(display_docs);
				var disp_matchup_standings = display_docs
				console.log("Displaying matchup data...");
				res.render('baseball_matchups', {
					year: year1,
					owner: owner_name,
					matchup_standings: disp_matchup_standings
				})
			}) // display and render data
		}) // end of pyshell

	} // end of if statement
	
} // end of complete function

}) // end of get(/ownerX_matchups=2016_2017)

