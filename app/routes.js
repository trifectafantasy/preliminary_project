//require express
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var mongo = require('mongodb');
var assert = require('assert');

var MongoClient = mongo.MongoClient;
var mongo_url = 'mongodb://localhost:27017/espn';

// create router object
var router = express.Router();

// export router to server.js file
module.exports = router;

router.get('/scrape_standings', function(req, res) {

	//var url = 'http://games.espn.com/fba/standings?leagueId=100660$seasonId=2017';
	var url = 'http://games.espn.com/flb/standings?leagueId=109364&seasonId=2016';

	request(url, function(error, response, html) {

		if(!error){

			var $ = cheerio.load(html);

			var division, team, wins, losses, ties, win_per
			var standings = new Array();

			$('tr[class=tableBody]').each(function(i, element) {

				var json = {
				division: "", 
				team: "",
				wins: "",
				losses: "",
				ties: "",
				win_per: ""
				};

				division = $(this).parent().children().first();
				team = $(this).children().children();
				wins = team.parent().next();
				losses = wins.next();
				ties = losses.next();
				win_per = ties.next();

				json.division=division.text();
				json.team=team.text();
				json.wins=parseInt(wins.text());
				json.losses=parseInt(losses.text());
				json.ties=parseInt(ties.text());
				json.win_per=parseFloat(win_per.text());

				standings.push(json);

			})

			//console.log(standings);

				MongoClient.connect(mongo_url, function(err, db) {

					assert.equal(null, err);

					insertDocument(db, function(db, callback) {});

					readCollection(db, function() {

						db.close();
					})
				});

				var insertDocument = function(db, callback) {

					var collection = db.collection('baseball_2016_standings');

					collection.insert(standings, function(err, result) {
				    
				    	assert.equal(err, null);
				    	console.log("A document was inserted into the collection");
				    
				    	callback(result);
					});
				}


				var readCollection = function(db, callback) {

					var cursor = db.collection('baseball_2016_standings').find({});

					cursor.each(function(err, doc) {

						assert.equal(err, null);

						if (doc != null) {

							console.dir(doc);

						} else {

							callback();
						}
					});
				};
			
		}
	})

})

