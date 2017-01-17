//require express
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');

var mongo = require('mongodb');
var assert = require('assert');

var MongoClient = mongo.MongoClient;
var mongo_url = 'mongodb://localhost:27017/espn';

var db;

// Initialize connection once
MongoClient.connect("mongodb://localhost:27017/espn", function(err, database) {
  
  if(err) throw err;

  db = database;

});

// create router object
var router = express.Router();

// export router to server.js file
module.exports = router;

router.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, "../index.html"));
})

router.get('/scrape_standings', function(req, res) {

	//res.sendFile(path.join(__dirname, "../baseball_standings.html"));

	//var url = 'http://games.espn.com/fba/standings?leagueId=100660&seasonId=2017';
	var url = 'http://games.espn.com/flb/standings?leagueId=109364&seasonId=2016';

	request(url, function(error, response, html) {

		if(!error){

			//res.sendFile(path.join(__dirname, "../baseball_standings.html"));

			var $ = cheerio.load(html);

			var division, team, wins, losses, ties, win_per
			var h2h_standings = new Array();

			var h2h_rank, team, R, HR, RBI, SO, SB, OBP, K, QS, W, SV, ERA, WHIP
			var roto_standings = new Array();

			$('tr[class=tableBody]').each(function(i, element) {

				var json1 = {
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

				json1.division = division.text();
				json1.team = team.text();
				json1.wins = parseInt(wins.text());
				json1.losses = parseInt(losses.text());
				json1.ties = parseInt(ties.text());
				json1.win_per = parseFloat(win_per.text());

				h2h_standings.push(json1);
			})

			$('tr[class="tableBody sortableRow"]').each(function(i, element) {

				var json2 = {
					h2h_rank: "",
					team: "",
					R: "",
					HR: "",
					RBI: "",
					SO: "",
					SB: "",
					OBP: "",
					K: "",
					QS: "",
					W: "",
					SV: "",
					ERA: "",
					WHIP: ""
				}

				h2h_rank = $(this).children().first();
				team = h2h_rank.next();
				R = team.next().next();
				HR = R.next();
				RBI = HR.next();
				SO = RBI.next();
				SB = SO.next();
				OBP = SB.next();

				K = OBP.next().next();
				QS = K.next();
				W = QS.next();
				SV = W.next();
				ERA = SV.next();
				WHIP = ERA.next();

				json2.h2h_rank = parseInt(h2h_rank.text());
				json2.team = team.text();
				json2.R = parseInt(R.text());
				json2.HR = parseInt(HR.text());
				json2.RBI = parseInt(RBI.text());
				json2.SO = parseInt(SO.text());
				json2.SB = parseInt(SB.text());
				json2.OBP = parseFloat(OBP.text());

				json2.K = parseInt(K.text());
				json2.QS = parseInt(QS.text());
				json2.W = parseInt(W.text());
				json2.SV = parseInt(SV.text());
				json2.ERA = parseFloat(ERA.text());
				json2.WHIP = parseFloat(WHIP.text());

				roto_standings.push(json2);

			})
			
			//console.log(standings);
			//console.log(roto_standings);


			var insertDocument = function(db, callback) {

				var collection1 = db.collection('baseball_2016_h2h');
				var collection2 = db.collection('baseball_2016_roto');

				collection1.insert(h2h_standings, function(err, result) {
			    
			    	assert.equal(err, null);
			    	//console.log("A document was inserted into the collection");
			    
			    	callback(result);
				});

				collection2.insert(roto_standings, function(err, result) {
			    
			    	assert.equal(err, null);
			    	//console.log("A document was inserted into the collection");
			    
			    	callback(result);
				});
			}


			var readCollection = function(db, callback) {

				var cursor1 = db.collection('baseball_2016_h2h').find({});
				var cursor2 = db.collection('baseball_2016_roto').find({});

				cursor1.each(function(err, doc) {

					assert.equal(err, null);

					if (doc != null) {

						console.dir(doc);

					} else {

						callback();
					}
				});

				cursor2.each(function(err, doc) {

					assert.equal(err, null);

					if (doc != null) {

						console.dir(doc);

					} else {

						callback();
					}
				});

			};
			
		insertDocument(db, function(db, callback) {});
		
		res.sendFile(path.join(__dirname, "../baseball_standings.html"));
		
		}
	})

})

