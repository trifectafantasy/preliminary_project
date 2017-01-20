///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

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

// create router object
var router = express.Router();
// export router to server.js file
module.exports = router;

// Route to Home/Root page
router.get('/', function(req, res) {
	// send response as index.html page
	//res.sendFile(path.join(__dirname, "../index.html"));
	const message = {
		message: "Welcome to The Chip and Markers Trifecta Fantasy League Home Page"
	}
	res.render('index', message);
});

// route to /baseball_standings
router.get('/baseball_standings=2016', function(req, res) {

// Srape already taken place so just render results from mongdb 

///// EXECUTE SCRIPT /////

	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_roto_standings = null;

	// pull from mongodb and display new data after python script finishes
	db.collection('baseball_2016_h2h').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
		//console.log(docs);
		console.log("Displaying h2h data...")
		disp_h2h_standings = docs;
		// call complete to see if both finds are done
		complete();
	});

	db.collection('baseball_2016_roto').find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
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
				roto_standings: disp_roto_standings
			});
		}
	}

}) // end of .get('/baseball_standings')


// route to /basketball_standings
router.get('/basketball_standings=2016', function(req, res) {

// Already scraped so just pull from mongdb
	
///// EXECUTE SCRIPT /////

	// initialize display database queries
	var disp_h2h_standings = null;
	var disp_roto_standings = null;

	// pull from mongodb and display new data after python script finishes
	db.collection('basketball_2016_h2h').find({}, {"_id": 0}).sort({"win_per": -1}).toArray(function(e, docs) {
		//console.log(docs);
		console.log("Displaying h2h data...")
		disp_h2h_standings = docs;
		// call complete to see if both finds are done
		complete();
	});

	db.collection('basketball_2016_roto').find({}, {"_id": 0}).sort({"roto_trifecta_points": -1}).toArray(function(e, docs) {
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
			res.render('basketball_standings', {
				h2h_standings: disp_h2h_standings,
				roto_standings: disp_roto_standings
			});
		}
	}


		
}); // end of .get('/basketball_standings')

// route to /football_standings
router.get('/football_standings=2016', function(req, res) {

///// EXECUTE SCRIPT /////
	// initialize display database queries
	var disp_h2h_standings = null;

	// pull from mongodb and display new data after python script finishes
	db.collection('football_2016_h2h').find({}, {"_id": 0}).sort({"trifecta_points": -1}).toArray(function(e, docs) {
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
				h2h_standings: disp_h2h_standings
			});
		}
	}

}); // end of .get('/foottball_standings')
