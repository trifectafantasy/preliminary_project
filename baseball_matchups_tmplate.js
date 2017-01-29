router.get('/owner2_matchups=2016_2017', function(req, res) {	
	var baseball_iterate_complete = 0;
	// full regular season = 22 matchups
	var baseball_completed_matchups = 13;
	var baseball_playoffs = false;

	if (baseball_playoffs == false) {

		db.collection("owner" + owner_number + "_baseball_matchups_scrape_" + year2).remove({})

		db.collection('owner' + owner_number).find({}, {"owner": 1,"teams": 1, "_id": 0}).toArray(function(e, docs) {
			owner_name = docs[0]["owner"];
			//console.log(owner_name);
			owner_team_list = docs[0]["teams"];
			//console.log(owner_team_list);

			var baseball_team1, baseball_team2, baseball_opposing_owner, baseball_my_team, baseball_opposing_team
			var baseball_record1, baseball_record2, baseball_save_record
			//var baseball_matchup_number = 1

			for (baseball_matchup_number = 1; baseball_matchup_number < baseball_completed_matchups + 1; baseball_matchup_number++) {


				var url = 'http://games.espn.com/fba/scoreboard?leagueId=100660&seasonId=' + year2 + '&matchupPeriodId=' + baseball_matchup_number;

				request(url, function(error, response, html) {

					// if not an error
					if(!error){

						// use cheerio to traverse and scrape html 
						var $ = cheerio.load(html);

						$('tr.tableSubHead').each(function(j, element) {

							save_record = null;

							baseball_team1 = $(this).next().children().children().first();
							//console.log(baseball_team1.text());

							baseball_record1 = $(this).next().children().last().children();
							//console.log(baseball_record1.text());

							baseball_team2 = $(this).next().next().children().children().first();
							//console.log(baseball_team2.text());

							baseball_record2 = $(this).next().next().children().last().children();
							//console.log(baseball_record2.text());


							if (owner_team_list.includes(baseball_team1.text()) == true) {
								baseball_my_team = baseball_team1.text();
								baseball_opposing_team = baseball_eam2.text();
								//console.log(baseball_my_team);
								//console.log(baseball_opposing_team);
								baseball_save_record = baseball_record1.text();
								//console.log(baseball_save_record);
								baseball_opposing_owner = owners_per_team_name_list["teams"][baseball_opposing_team]["owner"]
								//console.log(opposing_owner);

							}
							else if (owner_team_list.includes(baseball_team2.text()) == true) {
								baseball_my_team = baseball_team2.text();
								baseball_opposing_team = baseball_team1.text();
								//console.log(baseball_my_team);
								//console.log(opposing_team);		
								baseball_save_record = baseball_record2.text();
								//console.log(baseball_ave_record);
								baseball_opposing_owner = owners_per_team_name_list["teams"][baseball_opposing_team]["owner"]
								baseball_console.log(baseball_opposing_owner);

							}
							if (baseball_save_record != null) {
								db.collection('owner' + owner_number + "_baseball_matchups_scrape_" + year2).insert({"opposing_owner": baseball_opposing_owner, "record": baseball_save_record})
								baseball_complete();
							}
							
						}) // end of table.ptsBased.matchup iteration
					} // end of if(!error)
				}) // end of request
			} // end of for loop



		}) // end of owner team collection
	}
	else {

	}

var baseball_complete = function() {
	baseball_iterate_complete += 1;
	if (baseball_iterate_complete === baseball_completed_matchups) {
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
})