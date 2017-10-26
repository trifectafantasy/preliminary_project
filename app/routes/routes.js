///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');
var forEach = require('async-foreach').forEach;

var mongo = require('mongodb');
var assert = require('assert');
var math = require('mathjs');

// create router object
var router = express.Router();
// export router to server.js file
module.exports = router;

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


// set years of current trifecta season to test against
var current_year1 = 2017;
var current_year2 = 2018;

// year of most recent totally completed (in the past) season
var completed_football_season = 2016;
var completed_basketball_season = 2017;
var completed_baseball_season = 2017;

// football status variables
var this_football_season_started = true;
var this_football_playoffs = false;
var this_football_completed_season = false;
// full regular season = 13 matchups
var football_completed_matchups = 7;

// basktball status variables
var this_basketball_season_started = true;
//set to false if want to stop scraping roto standings after regular season has ended
var this_basketball_in_season = true;
var this_basketball_playoffs = false;
var this_basketball_completed_season = false;
// full regular season = 18 matchups
var basketball_completed_matchups = 1;

// baseball status variables
var this_baseball_season_started = false;
//set to false if want to stop scraping roto standings after regular season has ended
var this_baseball_in_season = false;
var this_baseball_playoffs = false;
var this_baseball_completed_season = false;
// full regular season = 22 matchups
var baseball_completed_matchups = 0;

// exception built in for when Football in new Trifecta season starts during Baseball in previous Trifecta season
var football_ahead = false;
var football_ahead_current_year = 2017;
var football_ahead_completed_matchups = 3;

// sport that has full draft order and picks ready
var set_board_sport = "basketball";


// Route to Home/Root page
router.get('/', function(req, res) {
	res.render('index', {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	});
});

// route to future draft boards home page
router.get('/future_draft_boards_home_page', function(req, res) {
	res.render('future_draft_boards_home_page');
}); 

// route to future draft boards
router.get('/future_draft_board/:sport/:year', function(req, res) {
	var sport = req.params.sport;
	var year = req.params.year;

	if (year > current_year2 + 1) {
		res.send("Too far in advance, enter an earlier season. Can only go one year ahead of current sport.");
	}

	else if ((year > current_year1 + 1 && sport == "football") && football_ahead == false) {
		res.send("Too far in advance, enter an earlier season. Can only go one year ahead of current sport.");
	}

	else {
		if (sport == set_board_sport) {
			set_board = true;
		}
		else {
			set_board = false;
		}

		var disp_draft_board = null;
		var disp_by_team_draft_board = null;

		db.collection(sport + "_draft_board_" + year).find({"draft_board": "overall"}, {"draft_board": 0, "_id": 0}).sort({"round_number": 1}).toArray(function(e, docs){
			disp_draft_board = docs;
			//console.log(disp_draft_board);
			complete();
		})

		db.collection(sport + "_draft_board_" + year).find({"draft_board": "team"}, {"draft_board": 0, "_id": 0}).toArray(function(e, docs){
			disp_by_team_draft_board = docs;
			//console.log(disp_by_team_draft_board);
			complete();
		})
	}

var complete = function() {

	if (disp_draft_board != null && disp_by_team_draft_board != null) {
		console.log("displaying draft board...");
		res.render('future_draft_boards', {
			sport: sport,
			year: year,
			draft_board: disp_draft_board,
			by_team_draft_board: disp_by_team_draft_board,
			set_board: set_board
		})
	}
}
}) // end of route to future draft boards home page

// route to profile home page
router.get('/profile_home_page', function(req, res) {
	res.render('profile_home_page');
});

// route to individual owner profiles
router.get('/owner/:owner_number/profile/recap', function(req, res) {

	var input = {
		owner_number: req.params.owner_number,
		start_year: 2015,
		end_year: current_year2,
		this_football_completed_season: this_football_completed_season,
		this_basketball_completed_season: this_basketball_completed_season,
		this_baseball_completed_season: this_baseball_completed_season
	};

	let profile_route = require('./profile.js').profile_recap;
	const send = profile_route(req, res, db, input);

}); // end of profile season reacap

// route to each owner's trophy case
router.get('/owner/:owner_number/profile/trophy', function(req, res) {

	var input = {
		owner_number: req.params.owner_number
	};

	let profile_trophy = require('./profile.js').trophy_case;
	const send = profile_trophy(req, res, db, input);

}) // end of route to trophy case


// route to trifecta standings
router.get('/trifecta_standings/:year1/:year2', function(req, res) {

	var input = {
		year1: req.params.year1,
		year2: req.params.year2,
		current_year1: current_year1,
		current_year2: current_year2,
		football_season_started: this_football_season_started,
		basketball_season_started: this_basketball_season_started,
		baseball_season_started: this_baseball_season_started
	};

	let trifecta_standings = require('./standings.js').trifecta_standings;
	const send = trifecta_standings(req, res, db, input);

}); // end of trifecta_standings route

// route to /football_standings
router.get('/football_standings/:year', function(req, res) {

	var input = {
		year: req.params.year,
		playoffs: this_football_playoffs,
		completed_football_season: completed_football_season
	};

	let football_standings = require('./standings.js').football_standings;
	const send = football_standings(req, res, db, input);

}); // end of .get('/football_standings')

// route to /basketball_standings
router.get('/basketball_standings/:year', function(req, res) {

	var input = {
		year: req.params.year,
		playoffs: this_basketball_playoffs,
		completed_basketball_season: completed_basketball_season
	};

	let basketball_standings = require('./standings.js').basketball_standings;
	const send = basketball_standings(req, res, db, input);
	
}); // end of .get('/basketball_standings')

// route to /baseball_standings
router.get('/baseball_standings/:year', function(req, res) {

	var input = {
		year: req.params.year,
		playoffs: this_baseball_playoffs,
		completed_baseball_season: completed_baseball_season
	};

	let baseball_standings = require('./standings.js').baseball_standings;
	const send = baseball_standings(req, res, db, input);
	
}) // end of .get('/baseball_standings')


// route to home page for all individual owner matchup data
router.get('/owner_matchup_home_page', function(req, res) {
	res.render('owner_matchup_home_page');
})

// route to individual owner's matchups for a given trifecta season
router.get('/owner/:owner_number/matchups/:year1/:year2', function(req, res) {

	var input = {
		owner_number: req.params.owner_number,
		year1: req.params.year1,
		year2: req.params.year2,
		current_year1: current_year1,
		current_year2: current_year2
	};

	var football_input = {
		this_football_season_started: this_football_season_started,
		football_completed_matchups: football_completed_matchups,
		this_football_completed_season: this_football_completed_season,
		football_ahead: football_ahead,
		football_ahead_completed_matchups: football_ahead_completed_matchups
	};

	var basketball_input = {
		this_basketball_season_started: this_basketball_season_started,
		basketball_completed_matchups: basketball_completed_matchups,
		this_basketball_completed_season: this_basketball_completed_season
	};

	var baseball_input = {
		this_baseball_season_started: this_baseball_season_started,
		baseball_completed_matchups: baseball_completed_matchups,
		this_baseball_completed_season: this_baseball_completed_season
	};

	let owner_matchups = require('./matchups.js').owner_matchups;
	const send = owner_matchups(req, res, db, input, football_input, basketball_input, baseball_input);

}); // end of owner to owner matchups 


// route to individual owner's matchups for all trifecta seasons
router.get('/owner/:owner_number/matchups/all', function(req, res) {

	var input = {
		owner_number: req.params.owner_number,
	};

	var football_input = {
		completed_football_season: completed_football_season,
		this_football_season_started: this_football_season_started,
		football_completed_matchups: football_completed_matchups,
		this_football_completed_season: this_football_completed_season,
		football_ahead: football_ahead,
		football_ahead_completed_matchups: football_ahead_completed_matchups
	};

	var basketball_input = {
		completed_basketball_season: completed_basketball_season,
		this_basketball_season_started: this_basketball_season_started,
		basketball_completed_matchups: basketball_completed_matchups,
		this_basketball_completed_season: this_basketball_completed_season
	};

	var baseball_input = {
		completed_baseball_season: completed_baseball_season,
		this_baseball_season_started: this_baseball_season_started,
		baseball_completed_matchups: baseball_completed_matchups,
		this_baseball_completed_season: this_baseball_completed_season
	};

	let all_owner_matchups = require('./matchups.js').all_owner_matchups;
	const send = all_owner_matchups(req, res, db, input, football_input, basketball_input, baseball_input);	
	
}); // end of owner to owner matchups 

// route to home page for all individual owner matchup data
router.get('/trades_home_page', function(req, res) {
	res.render('trades_home_page');
})

router.get('/:sport/trades/:year', function(req, res) {

	let sport = req.params.sport;

	// set completed season for check if in season or not depending on sport
	if (sport === 'football') {
		completed_sport_season = completed_football_season;
	}
	else if (sport === 'basketball') {
		completed_sport_season = completed_basketball_season;
	}
	else if (sport === 'baseball') {
		completed_sport_season = completed_baseball_season;
	}

	var input = {
		year: req.params.year,
		sport: req.params.sport,
		completed_sport_season: completed_sport_season
	};

	let trade = require('./trade.js').trade;
	const send = trade(req, res, db, input);

}) // end of route to trades


// route to acquisition home page
router.get('/acquisition_value_home_page', function(req, res) {
	res.render('acquisition_value_home_page');
}) // end of acquisition home page


// route to football and basketball acquistion values
router.get('/owner/:owner_number/:sport/acquisitions/:year', function(req, res) {

	let sport = req.params.sport;

	// set completed season for check if in season or not depending on sport
	if (sport === 'football') {
		completed_sport_season = completed_football_season;
	}
	else if (sport === 'basketball') {
		completed_sport_season = completed_basketball_season;
	}
	else if (sport === 'baseball') {
		completed_sport_season = completed_baseball_season;
	}		

	var input = {
		sport: req.params.sport,
		year: req.params.year,
		owner_number: req.params.owner_number,
		completed_sport_season: completed_sport_season
	};

	let acquisitions = require('./acquisitions.js').acquisitions;
	const send = acquisitions(req, res, db, input);

}) // end of route to football and basketball acquisition stats


// route to acquisition home page
router.get('/stats_home_page', function(req, res) {
	res.render('stats_home_page');
}) // end of acquisition home page

// route to roster stats
router.get('/owner/:owner_number/:sport/stats/:year', function(req, res) {

	var sport = req.params.sport;

	// set completed season for check if in season or not depending on sport
	if (sport === 'football') {
		completed_sport_season = completed_football_season;
	}
	else if (sport === 'basketball') {
		completed_sport_season = completed_basketball_season;
	}

	else if (sport === 'baseball') {
		completed_sport_season = completed_baseball_season;
	}

	var input = {
		sport: req.params.sport,
		year: req.params.year,
		owner_number: req.params.owner_number,
		completed_sport_season: completed_sport_season
	};

	let stats = require('./stats.js').stats;
	const send = stats(req, res, db, input);

}) // end of route to football and basketball acquisition stats

// route to origin home page
router.get('/origin_home_page', function(req, res) {
	res.render('origin_home_page')
});

// route to origin analysis
router.get('/:sport/origin/:year', function(req, res) {

	var sport = req.params.sport;

	// set completed season for check if in season or not depending on sport
	if (sport === 'football') {
		completed_sport_season = completed_football_season;
	}
	else if (sport === 'basketball') {
		completed_sport_season = completed_basketball_season;
	}
	else if (sport === 'baseball') {
		completed_sport_season = completed_baseball_season;
	}

	var input = {
		sport: req.params.sport,
		year: req.params.year,
		completed_sport_season: completed_sport_season
	};

	let origin = require('./origin.js').origin;
	const send = origin(req, res, db, input);

}); // end of origin route

// home page for football coach rankings
router.get('/football_coach_home_page', function(req, res) {
	res.render('football_coach_home_page');
})

// route to analyze fantasy football "coaching" aka starting lineup optimization
router.get('/football/coach/:year', function(req, res) {

	// set variables from request url
	var year = req.params.year;

	// if year is greater than completed season, SCRAPE
	if (year > completed_football_season) {
	
		// how many weeks have been completed, able to scrape
		if (football_ahead == true) {
			var completed_weeks = football_ahead_completed_matchups;

		}
		else {
			var completed_weeks = football_completed_matchups
		}

		// list of owner numbers to loop through
		owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

	// function that executes synchronous scrapes and python script analyses
	var all_football_coach = function(x, owner_list) {
		if (x < owner_list.length) {
			// set owner number
			owner_number = owner_list[x];
			console.log("owner number", owner_number);

			// scrape starting lineups and benches from each week
			var coach_scrape = require('./coach_scrape.js')(req, res, db, year, owner_number, completed_weeks, function(err, call) {
				console.log("coach scrape done");

				// send back to loop again
				all_football_coach(x + 1, owner_list);
			}) // end of coach scrape script
		}
		// once done with all in loop, done
		else {
			var options = {
				args: [year, completed_weeks]
			}
			pyshell.run('football_coach.py', options, function(err) {
				if (err) throw err;
				console.log("coach python script done");
				
				// pull from collection for display
				db.collection("all_coach_" + year).find({}, {"_id": 0}).sort({"season": -1}).toArray(function(e, docs) {
					disp_coach = docs;
					console.log("displaying coach standings...");

					res.render('football_coach', {
						year: year,
						completed_weeks: completed_weeks,
						coach_standings: disp_coach
					})
				}) // end of display pull				
			}) // end of python script
	
		}
	} // end of all_football_coach function

		// run synchronous for loop function
		all_football_coach(0, owner_list);
	} // end of if need to be scraped

	// if year is in past, just pull
	else {
		completed_weeks = 13
		// pull from collection for display
		db.collection("all_coach_" + year).find({}, {"_id": 0}).sort({"season": -1}).toArray(function(e, docs) {
			disp_coach = docs;
			console.log("displaying coach standings...");

			res.render('football_coach', {
				year: year,
				completed_weeks: completed_weeks,
				coach_standings: disp_coach
			})
		}) // end of display pull	
	} // end of just pull
						
}) // end of route to coach analysis

// route to popular home page
router.get('/popular_home_page', function(req, res) {
	res.render('popular_home_page');
})

// route to get most popular players
router.get('/:sport/popular/:year', function(req, res) {
	var sport = req.params.sport;
	var year = req.params.year;

// function that scrapes and calculates most popular players per owner per sport
var all_popular = function(x, owner_list) {

	if (x < owner_list.length) {
		owner_number = owner_list[x];
		console.log("owner number", owner_number);

		var popular = require('./popular.js')(req, res, db, sport, year, owner_number, function(err, call) {
			console.log("popular scrape done");

			var options = {
				args: [sport, year, owner_number]
			}

			// python script that calculates players with most transactions per team
			pyshell.run('popular_individual.py', options, function(err) {
				console.log("popular python script done");

				// send back through loop
				all_popular(x + 1, owner_list)
			}) // end of pyshell
		}) // end of popular.js scrape
	} // end of if still in loop
	
	// if finished with loop
	else {
		var options = {
			args: [sport, year]
		}

		// python script that calculates player that was on most teams and owners who had player on roster
		pyshell.run('popular_all.py', options, function(err) {
			console.log("all popular python script done");

			// pull all owner names NOT "all", ie all individual owners
			db.collection(sport + "_popular_" + year).find({"owner": {"$not": /all/}}, {"_id": 0}, {"sort": [["transactions", "desc"], ["owner", "desc"], [score_cat, "desc"]]}).toArray(function(e, docs) {
				disp_individual = docs;

				// pull owner that is all (has player on most teams data)
				db.collection(sport + "_popular_" + year).find({"owner": "all"}, {"_id": 0}).toArray(function(e, docs2) {
					disp_all = docs2;

					console.log("displaying most popular players...")
					res.render('popular', {
						sport: sport,
						year: year,
						popular_individual: disp_individual,
						popular_all: disp_all
					}) // end of render
				}) // end of all popular pull
			}) // end of individual popular pull
		}) // end of pyshell
	} // end of else
} // end of function

// start of executed script //
	var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

	// set completed season and scoring category depending on sport
	if (sport == "football") {
		completed_sport_season = completed_football_season;
		score_cat = "PTS";
	}
	else if (sport == "basketball") {
		completed_sport_season = completed_basketball_season;
		score_cat = "weighted_PR"
	}
	else if (sport == "baseball") {
		completed_sport_season = completed_baseball_season;
		score_cat = "weighted_PR"
	}

	// if season not completed, scrape
	if (year > completed_sport_season) {
		all_popular(0, owner_list);
	}
	// else just pull and display
	else {
		db.collection(sport + "_popular_" + year).find({"owner": {"$not": /all/}}, {"_id": 0}, {"sort": [["transactions", "desc"], ["owner", "desc"], [score_cat, "desc"]]}).toArray(function(e, docs) {
			disp_individual = docs;

			db.collection(sport + "_popular_" + year).find({"owner": "all"}, {"_id": 0}).toArray(function(e, docs2) {
				disp_all = docs2;

				console.log("displaying most popular players...")
				res.render('popular', {
					sport: sport,
					year: year,
					popular_individual: disp_individual,
					popular_all: disp_all
				}) // end od render
			}) // end of all pull
		}) // end of individual pull
	} // end of else
}) // end of route to sport popular
