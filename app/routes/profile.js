///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

function profile_recap(req, res, db, args) {
	
	let owner_number = args.owner_number;
	// define years in scope
	let start_year = args.start_year;
	let end_year = args.end_year;

	// per this trifecta season, if true, season complete and can pull finished season stats, if false, skip
	let this_football_completed_season = args.this_football_completed_season;
	let this_basketball_completed_season = args.this_basketball_completed_season;
	let this_baseball_completed_season = args.this_baseball_completed_season;

	let disp_profile_standings = null;
	let disp_profile_matchups = null;
	let disp_profile_players = null;
// complete function that displays tables

let profile_complete = function() {

	// wait for all 3 sets of data to be pulled
	if ((disp_profile_matchups != null && disp_profile_standings != null) && disp_profile_players != null) {
		console.log("displaying profile stats...");
		res.render('profile_recap', {
			owner: owner_name,
			profile_standings: disp_profile_standings,
			matchup_standings: disp_profile_matchups,
			players_standings: disp_profile_players
		})
	} // end of if
} // end of complete function

	// pull owner name
	db.collection('owner' + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"]
		//console.log(owner_name);

		let options = {
			args: [owner_number, start_year, end_year, this_football_completed_season, this_basketball_completed_season, this_baseball_completed_season]
		}

		// python script that calculates each owner's record that season
		pyshell.run('python/profile_standings.py', options, function(err) {
			console.log("profile standings python script done");

			// pull for display
			db.collection("owner" + owner_number + "_profile_standings").find({}, {"_id": 0}).toArray(function(e, docs2) {
				//console.log(docs2);
				disp_profile_standings = docs2;
				profile_complete();
			}) // end of pull for display
		}) // end of pyshell

		// python script that pulls each owner's best and worst matchups records 
		pyshell.run('python/profile_matchups.py', options, function(err) {
			console.log('profile matchups python script done');

			// pull for display
			db.collection("owner" + owner_number + "_profile_matchups").find({}, {"_id": 0}).toArray(function(e, docs3) {
				disp_profile_matchups = docs3;
				profile_complete();
			}) // end of pull for display
		}) // end of pyshell

		// python script that pulls each owner's best and worst players from season
		pyshell.run('python/profile_players.py', options, function(err) {
			console.log('profile players python script done');

			// pull for display
			db.collection('owner' + owner_number + "_profile_players").find({}, {"_id": 0}).toArray(function(e, docs4) {
				disp_profile_players = docs4;
				profile_complete();
			}) // end of pull for display
		}) // ned of pyshell
	}) // end of pull owner name

} // end of profile_recap module


function trophy_case(req, res, db, args) {

	let owner_number = args.owner_number;

	// pull owner name
	db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(e, docs) {
		owner_name = docs[0]["owner"];

		// pull owner's trophy case
		db.collection("owner" + owner_number + "_trophies").find({}, {"date": 0, "_id": 0}).sort({"date": 1}).toArray(function(e, docs2) {
			disp_trophies = docs2;
			console.log("displaying trophy case...")

			res.render('trophy_case', {
				owner: owner_name,
				trophies: disp_trophies
			}) // end of render
		}) // end of trophy case pull
	}) // end of owner name pull	

} // end of trophy_case module


module.exports = {
	profile_recap,
	trophy_case
};