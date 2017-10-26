///// IMPORT JAVASCRIPT PACKAGES //////
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const pyshell = require('python-shell');
const forEach = require('async-foreach').forEach;

const mongo = require('mongodb');
const assert = require('assert');
const math = require('mathjs');

// create router object
const router = express.Router();
// export router to server.js file
module.exports = router;

// Create MongoClient using collection espn
const MongoClient = mongo.MongoClient;
const mongo_url = 'mongodb://localhost:27017/espn';
let db;

// Initialize connection once
MongoClient.connect("mongodb://localhost:27017/espn", function(err, database) {
  
  if(err) throw err;
  // use database callback to set db
  db = database;
  console.log("Connected to MongoDB")

});

// Require routers for paths to different pages
const profile_router = require('./profile.js');
const standings_router = require('./standings.js');
const matchups_router = require('./matchups.js');
const trade_router = require('./trade.js');
const stats_router = require('./stats.js');
const acquisitions_router = require('./acquisitions.js');
const origin_router = require('./origin.js');
const popular_router = require('./popular.js');
const coach_router = require('./coach.js');
const draft_board_router = require('./draft_board.js');


// set years of current trifecta season to test against
let current_year1 = 2017;
let current_year2 = 2018;

// year of most recent totally completed (in the past) season
let completed_football_season = 2016;
let completed_basketball_season = 2017;
let completed_baseball_season = 2017;

// football status letiables
let this_football_season_started = true;
let this_football_playoffs = false;
let this_football_completed_season = false;
// full regular season = 13 matchups
let football_completed_matchups = 7;

// basktball status letiables
let this_basketball_season_started = true;
//set to false if want to stop scraping roto standings after regular season has ended
let this_basketball_in_season = true;
let this_basketball_playoffs = false;
let this_basketball_completed_season = false;
// full regular season = 18 matchups
let basketball_completed_matchups = 1;

// baseball status letiables
let this_baseball_season_started = false;
//set to false if want to stop scraping roto standings after regular season has ended
let this_baseball_in_season = false;
let this_baseball_playoffs = false;
let this_baseball_completed_season = false;
// full regular season = 22 matchups
let baseball_completed_matchups = 0;

// exception built in for when Football in new Trifecta season starts during Baseball in previous Trifecta season
let football_ahead = false;
let football_ahead_current_year = 2017;
let football_ahead_completed_matchups = 3;

// sport that has full draft order and picks ready
let set_board_sport = null;


// Route to Home/Root page
router.get('/', function(req, res) {
	res.render('index', {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	});
});


// route to profile home page
router.get('/profile_home_page', function(req, res) {
	res.render('profile_home_page');
});

// route to individual owner profiles
router.get('/owner/:owner_number/profile/recap', function(req, res) {

	let input = {
		owner_number: req.params.owner_number,
		start_year: 2015,
		end_year: current_year2,
		this_football_completed_season: this_football_completed_season,
		this_basketball_completed_season: this_basketball_completed_season,
		this_baseball_completed_season: this_baseball_completed_season
	};

	const send = profile_router.profile_recap(req, res, db, input);

}); // end of profile season reacap

// route to each owner's trophy case
router.get('/owner/:owner_number/profile/trophy', function(req, res) {

	let input = {
		owner_number: req.params.owner_number
	};

	const send = profile_router.trophy_case(req, res, db, input);

}) // end of route to trophy case


// route to trifecta standings
router.get('/trifecta_standings/:year1/:year2', function(req, res) {

	let input = {
		year1: req.params.year1,
		year2: req.params.year2,
		current_year1: current_year1,
		current_year2: current_year2,
		football_season_started: this_football_season_started,
		basketball_season_started: this_basketball_season_started,
		baseball_season_started: this_baseball_season_started
	};

	const send = standings_router.trifecta_standings(req, res, db, input);

}); // end of trifecta_standings route

// route to /football_standings
router.get('/football_standings/:year', function(req, res) {

	let input = {
		year: req.params.year,
		playoffs: this_football_playoffs,
		completed_football_season: completed_football_season
	};

	const send = standings_router.football_standings(req, res, db, input);

}); // end of .get('/football_standings')

// route to /basketball_standings
router.get('/basketball_standings/:year', function(req, res) {

	let input = {
		year: req.params.year,
		playoffs: this_basketball_playoffs,
		completed_basketball_season: completed_basketball_season
	};

	const send = standings_router.basketball_standings(req, res, db, input);
	
}); // end of .get('/basketball_standings')

// route to /baseball_standings
router.get('/baseball_standings/:year', function(req, res) {

	let input = {
		year: req.params.year,
		playoffs: this_baseball_playoffs,
		completed_baseball_season: completed_baseball_season
	};

	const send = standings_router.baseball_standings(req, res, db, input);
	
}) // end of .get('/baseball_standings')


// route to home page for all individual owner matchup data
router.get('/owner_matchup_home_page', function(req, res) {
	res.render('owner_matchup_home_page');
})

// route to individual owner's matchups for a given trifecta season
router.get('/owner/:owner_number/matchups/:year1/:year2', function(req, res) {

	let input = {
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

	const send = matchups_router.owner_matchups(req, res, db, input, football_input, basketball_input, baseball_input);

}); // end of owner to owner matchups 

// route to individual owner's matchups for all trifecta seasons
router.get('/owner/:owner_number/matchups/all', function(req, res) {

	let input = {
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

	const send = matchups_router.all_owner_matchups(req, res, db, input, football_input, basketball_input, baseball_input);	
	
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

	let input = {
		year: req.params.year,
		sport: req.params.sport,
		completed_sport_season: completed_sport_season
	};

	const send = trade_router.trade(req, res, db, input);

}) // end of route to trades


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

	let input = {
		sport: req.params.sport,
		year: req.params.year,
		owner_number: req.params.owner_number,
		completed_sport_season: completed_sport_season
	};

	const send = stats_router.stats(req, res, db, input);

}) // end of route to football and basketball acquisition stats


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

	let input = {
		sport: req.params.sport,
		year: req.params.year,
		owner_number: req.params.owner_number,
		completed_sport_season: completed_sport_season
	};

	const send = acquisitions_router.acquisitions(req, res, db, input);

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

	let input = {
		sport: req.params.sport,
		year: req.params.year,
		completed_sport_season: completed_sport_season
	};

	const send = origin_router.origin(req, res, db, input);

}); // end of origin route


// route to popular home page
router.get('/popular_home_page', function(req, res) {
	res.render('popular_home_page');
})

// route to get most popular players
router.get('/:sport/popular/:year', function(req, res) {
	var sport = req.params.sport;

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

	let input = {
		sport: req.params.sport,
		year: req.params.year,
		completed_sport_season: completed_sport_season,
		score_cat: score_cat
	};

	const send = popular_router.popular(req, res, db, input);

}) // end of route to sport popular


// home page for football coach rankings
router.get('/football_coach_home_page', function(req, res) {
	res.render('football_coach_home_page');
})

// route to analyze fantasy football "coaching" aka starting lineup optimization
router.get('/football/coach/:year', function(req, res) {

	let input = {
		year: req.params.year,
		completed_football_season: completed_football_season,
		completed_weeks: football_completed_matchups,
		football_ahead: football_ahead,
		football_ahead_completed_matchups: football_ahead_completed_matchups
	};

	const send = coach_router.coach(req, res, db, input);

}) // end of route to coach analysis


// route to future draft boards home page
router.get('/future_draft_boards_home_page', function(req, res) {
	res.render('future_draft_boards_home_page');
}); 

// route to future draft boards
router.get('/future_draft_board/:sport/:year', function(req, res) {

	let input = {
		sport: req.params.sport,
		year: req.params.year,
		current_year1: current_year1,
		current_year2: current_year2,
		football_ahead: football_ahead,
		set_board_sport: set_board_sport
	}

	const send = draft_board_router.draft_board(req, res, db, input);

}) // end of route to future draft boards home page
