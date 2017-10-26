///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function draft_board(req, res, db, args) {

	let sport = args.sport;
	let year = args.year;
	let current_year1 = args.current_year1;
	let current_year2 = args.current_year2;
	let football_ahead = args.football_ahead;
	let set_board_sport = args.set_board_sport;

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
} // end of complete function


	if (year > current_year2 + 1) {
		res.send("Too far in advance, enter an earlier season. Can only go one year ahead of current sport.");
	}

	else if ((year > current_year1 + 1 && sport == "football") && football_ahead == false) {
		res.send("Too far in advance, enter an earlier season. Can only go one year ahead of current sport.");
	}

	else {
		if (sport === set_board_sport) {
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
} // end of draft_board module

module.exports = {
	draft_board
}