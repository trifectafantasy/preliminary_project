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

//const validate = require('express-validation');
const {check, oneOf, validation_result} = require('express-validator/check');
const {matched_data, sanitize} = require('express-validator/filter');

// create router object
const router = express.Router();
// export router to server.js file
module.exports = router;

// Create MongoClient using collection espn
const MongoClient = mongo.MongoClient;
const mongo_url = 'mongodb://localhost:27017/espn';
let db;

let env_variables;
let current_year1, current_year2;
let completed_football_season, completed_basketball_season, completed_baseball_season;
let this_football_season_started, this_football_playoffs, this_football_completed_season;
let this_basketball_season_started, this_basketball_in_season, this_basketball_playoffs, this_basketball_completed_season;
let this_baseball_season_started, this_baseball_in_season, this_baseball_playoffs, this_baseball_completed_season;
let football_completed_matchups, basketball_completed_matchups, baseball_completed_matchups;
let football_ahead, football_ahead_current_year, football_ahead_completed_matchups;
let set_board_sport;


// function to set up callback for season_variables
function StartMongoDBInstance (mongo_url, callback) {

	MongoClient.connect(mongo_url, function(err, database) {
		if (err) throw err;

		db = database;
		console.log("Connected to MongoDB");

		db.collection("season_variables").find({}, {"_id": 0}).toArray(function(e, docs) {

			// send callback of season_variables json
			callback(docs[0]);
		})
	}) // end of MongoClient connection
}

function set_season_variables(env_variables, res) {

	//console.log(env_variables);

	// set years of current trifecta season to use
	current_year1 = env_variables.current_year1;
	current_year2 = env_variables.current_year2;

	// year of most recently totally completed (in past) season per sport
	completed_football_season = env_variables.completed_football_season;
	completed_basketball_season = env_variables.completed_basketball_season;
	completed_baseball_season = env_variables.completed_baseball_season;

	// football status variables
	this_football_season_started = env_variables.this_football_season_started;
	this_football_playoffs = env_variables.this_football_playoffs;
	this_football_completed_season = env_variables.this_football_completed_season;
	// full regular season = 13 matchups
	football_completed_matchups = env_variables.football_completed_matchups;

	// basketball status variables
	this_basketball_season_started = env_variables.this_basketball_season_started;
	// set to false if want to stop scraping roto standings after regular season has ended
	this_basketball_in_season = env_variables.this_basketball_in_season;
	this_basketball_playoffs = env_variables.this_basketball_playoffs;
	this_basketball_completed_season = env_variables.this_basketball_completed_season;
	// full regular season = 18 matchups
	basketball_completed_matchups = env_variables.basketball_completed_matchups;

	// baseball status variables
	this_baseball_season_started = env_variables.this_baseball_season_started;
	// set to false if want to stop scraping roto standings after regular season had ended8
	this_baseball_in_season = env_variables.this_baseball_in_season;
	this_baseball_playoffs = env_variables.this_baseball_playoffs;
	this_baseball_completed_season = env_variables.this_baseball_completed_season;
	// full regular season = 22 matchups
	baseball_completed_matchups = env_variables.baseball_completed_matchups;

	// exception built in for when Football is in new Trifecta season starts during Baseball in preivous Trifecta season
	football_ahead = env_variables.football_ahead;
	football_ahead_current_year = env_variables.football_ahead_current_year;
	football_ahead_completed_matchups = env_variables.football_ahead_completed_matchups;

	// sport that has full draft order and picks read
	set_board_sport = env_variables.set_board_sport;

	console.log("Season variables loaded");

}

// Initialize connection and load season variables
StartMongoDBInstance(mongo_url, function(env_variables) {

	set_season_variables(env_variables);
});

const secret_mission_router = require('./secret_mission.js');

// Require routers for paths to different pages
const utility_router = require('./utility.js');
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

const matchups_update = require('../modules/matchups_number_update.js');

// Route to secret-mission pages
router.get('/secret_mission', function(req, res) {
	res.render('secret_mission/home_page', {
		message: ""
	})
})

router.post('/secret_mission/email', function(req, res) {
	res.render('secret_mission/email', {
		name: req.body.name
	})
})

router.post('/secret_mission/instructions', function(req, res) {
	res.render('secret_mission/instructions', {
		name: req.body.name
	})
})

router.post('/secret_mission/friendship_wing', function(req, res) {
	res.render('secret_mission/friendship_wing', {
		name: req.body.name
	})
})

router.post('/secret_mission/front_door', function(req, res) {
	res.render('secret_mission/front_door', {
		name: req.body.name
	})
})

router.post('/secret_mission/banter', function(req, res) {
	res.render('secret_mission/banter', {
		name: req.body.name
	})
})

router.post('/secret_mission/the_tweedles', function(req, res) {
	res.render('secret_mission/the_tweedles', {
		name: req.body.name
	})
})

router.post('/secret_mission/the_tweedles/tweedle1', function(req, res) {
	res.render('secret_mission/tweedle1', {
		name: req.body.name
	})
})

router.post('/secret_mission/the_tweedles/tweedle2', function(req, res) {
	res.render('secret_mission/tweedle2', {
		name: req.body.name
	})
})

router.post('/secret_mission/the_tweedles/tweedle3', function(req, res) {
	res.render('secret_mission/tweedle3', {
		name: req.body.name
	})
})

router.post('/secret_mission/password_door', function(req, res) {
	res.render('secret_mission/password_door', {
		name: req.body.name
	})
})

router.post('/secret_mission/pie', function(req, res) {
	res.render('secret_mission/pie', {
		name: req.body.name
	})
})

router.post('/secret_mission/foyer', function(req, res) {
	res.render('secret_mission/foyer', {
		name: req.body.name
	})
})



/*
router.post('/secret_mission_name', check('name', "Please enter your Agent Name").isIn(['wes','Wes']), function(req, res) {

	var error_array = req._validationErrors;

	if (req._validationErrors.length > 0) {
		console.log(error_array[0].msg);

		res.render('secret_mission/home_page',{
			messgae: error_array[0].msg
		})

	}
	else {
		res.send("you're good");
	}
/*
	try {
		validation_result(req);
	}
	catch (err) {
		console.log(validation_result(req))
		res.send('bad!')
	}
	res.send('good!')

/*
	if (req.body.name === "wes") {

		console.log(req.body);
		res.redirect('secret_mission');

	}
	else {
		res.
	}


})
*/

// Route to Home/Root page
router.get('/', function(req, res) {
	res.render('index', {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	});
});


router.get('/utility/season_variables', function(req, res) {
	const send = utility_router.get_season_variables(req, res, db);
});

router.put('/utility/season_variables', function(req, res) {
	const send = utility_router.modify_season_variables(req, res, db, req.body, function(good_header_requests, bad_header_requests) {

		// close previous mongodb connection
		db.close();

		// Initialize connection and load season variables
		StartMongoDBInstance(mongo_url, function(env_variables) {
			set_season_variables(env_variables, res);

			res.status(200).send({"status": "Season variables re-loaded", "successful_header_requests": good_header_requests, "bad_header_requests": bad_header_requests});

		})
	});
});

router.post('/utility/add_team_name', function(req, res) {
	const send = utility_router.add_team_name(req, res, db, req.body);
})

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
	//console.log(input);

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
		completed_football_season: completed_football_season,
		this_football_season_started: this_football_season_started,
		playoffs: this_football_playoffs
	};

	const send = standings_router.football_standings(req, res, db, input);

}); // end of .get('/football_standings')

// route to /basketball_standings
router.get('/basketball_standings/:year', function(req, res) {

	let input = {
		year: req.params.year,
		completed_basketball_season: completed_basketball_season,
		this_basketball_season_started: this_basketball_season_started,
		playoffs: this_basketball_playoffs
	};

	const send = standings_router.basketball_standings(req, res, db, input);
	
}); // end of .get('/basketball_standings')

// route to /baseball_standings
router.get('/baseball_standings/:year', function(req, res) {

	let input = {
		year: req.params.year,
		completed_baseball_season: completed_baseball_season,
		this_baseball_season_started: this_baseball_season_started,
		playoffs: this_baseball_playoffs,
	};

	const send = standings_router.baseball_standings(req, res, db, input);
	
}) // end of .get('/baseball_standings')


// route to home page for all individual owner matchup data
router.get('/owner_matchup_home_page', function(req, res) {
	res.render('owner_matchup_home_page');
})

// route to individual owner's matchups for a given trifecta season
router.get('/owner/:owner_number/matchups/:year1/:year2', function(req, res) {

	var sports_list = [];

	if (this_baseball_season_started == true) {
		sports_list = ["football", "basketball", "baseball"];
	}
	else if (this_basketball_season_started == true) {
		sports_list = ["football", "basketball"];
	}
	else {
		sports_list = ["football"];
	}

	let year_list = [current_year1, current_year2];
	let owner_number = req.params.owner_number;

	var new_team_name = require('../modules/team_name_update.js')(req, res, db, sports_list, year_list, owner_number, function(err, call) {
		//console.log("team names done");
		let year1 = req.params.year1;
		let year2 = req.params.year2;

		let input = {
			owner_number: owner_number,
			year1: year1,
			year2: year2,
			current_year1: current_year1,
			current_year2: current_year2
		};

		setTimeout(function() {

			const matchups_update_send = matchups_update.update_matchups(req, res, db, sports_list, year1, year2, function(err, call) {

				setTimeout(function() {

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

				}, 2000) // end of setTimeout to wait for matchups numbers variables to reset
			}) // end of update matchups function
		}, 2000) // end of setTimeout to wait for team names variables to reset

	});	// end of new team name 

}); // end of owner to owner matchups 

// route to individual owner's matchups for all trifecta seasons
router.get('/owner/:owner_number/matchups/all', function(req, res) {

	let owner_number = req.params.owner_number;

	//request to update current trifecta season's matchups before pulling total matchups
	request.get({url: "http://localhost:8081/owner/" + owner_number + "/matchups/" + current_year1 + "/" + current_year2}, function(err, response, body) {
		//console.log(response.body);
	
		let input = {
			owner_number: owner_number
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
	}); // end of request to update current trifecta season's matchups before pulling total matchups
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

	const send = trade_router.trade_analysis(req, res, db, input);

}) // end of route to trades

router.get('/trade_history', function(req, res) {
	const send = trade_router.trade_history_display(req, res, db);
})

// route to trade_history_scrape
//router.get('/trade_history_scrape/:sport/:year', function(req, res) {
router.post('/trade_history_upload', function(req, res) {

	let input = {
		date: req.body.date,
		owner1: req.body.owner1,
		owner1_players: req.body.owner1_players,
		owner2: req.body.owner2,
		owner2_players: req.body.owner2_players
	};

	const send = trade_router.trade_history_upload(req, res, db, input);
})



// route to stats home page
router.get('/stats_home_page', function(req, res) {
	res.render('stats_home_page');
}) // end of stats home page

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

}) // end of route to roster stats


// route to acquisition home page
router.get('/acquisition_value_home_page', function(req, res) {
	res.render('acquisition_value_home_page');
}) // end of acquisition home page

// route to football and basketball acquistion values
router.get('/owner/:owner_number/:sport/acquisitions/:year', function(req, res) {

	let sports_list = [req.params.sport];
	let year_list = [req.params.year];
	let owner_number = req.params.owner_number;

	if (owner_number === 'all') {
		// call trifecta standings to update team names
		request("http://localhost:8081/trifecta_standings/" + current_year1 + "/" + current_year2, function(err, trifecta_response, trifecta_body) {
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
		})
	}

	else {
		var match = require('../modules/team_name_update.js')(req, res, db, sports_list, year_list, owner_number, function(err, call) {
			//console.log("final");
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

			setTimeout(function() {
				const send = acquisitions_router.acquisitions(req, res, db, input);
			}, 2000) // end of setTimeout to let matchups numbers variables reset
		});
	}
}) // end of route to acquisition stats


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

	let year = req.params.year;

	if (year > completed_football_season) {

		let sports_list = ["football"];
		let year1 = year;
		let year2 = String(parseInt(year1) + 1);

		const matchups_update_send = matchups_update.update_matchups(req, res, db, sports_list, year1, year2, function(err, call) {

			setTimeout(function() {
				let input = {
					year: req.params.year,
					completed_football_season: completed_football_season,
					completed_weeks: football_completed_matchups,
					football_ahead: football_ahead,
					football_ahead_completed_matchups: football_ahead_completed_matchups
				};

				const send = coach_router.coach(req, res, db, input);
			}, 2000); // end of setTimeout for matchups numbers variables to reset
		})
	}
	else {

		let input = {
			year: req.params.year,
			completed_football_season: completed_football_season,
			completed_weeks: football_completed_matchups,
			football_ahead: football_ahead,
			football_ahead_completed_matchups: football_ahead_completed_matchups
		};

		const send = coach_router.coach(req, res, db, input);
	}
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

// Test endpoint
/*
router.get('/scraper/:sport/:year', function(req, res) {

	let sport = req.params.sport;
	let year = req.params.year;

	var match = require('../modules/playoffs_test.js')(req, res, db, sport, year, function(err, call) {
		//console.log("final");
	});				


})
*/