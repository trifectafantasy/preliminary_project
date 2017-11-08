///// IMPORT JAVASCRIPT PACKAGES //////
let express = require('express');
let request = require('request');
let cheerio = require('cheerio');
let path = require('path');
let pyshell = require('python-shell');

let mongo = require('mongodb');
let assert = require('assert');

let forEach = require('async-foreach').forEach;


function get_season_variables(req, res, db) {
	db.collection('season_variables').find({}, {"_id": 0}).toArray(function(e, season_variables) {
		//console.log(season_variables[0]);
		console.log("Season variables returned");

		res.status(200).send(season_variables[0]);
	})
}


function modify_season_variables(req, res, db, args, final_callback) {

	// fuction that removes headers that do not exist. to protect season_variables collection
	function verify_request_headers(callback1) {

		let bad_header_requests = [];

		db.collection('season_variables').find({}, {"_id": 0}).toArray(function(e, season_variables) {

			// pull list of season_variables_headers
			season_variables_headers = Object.keys(season_variables[0])	

			// make list of request headers	
			let request_headers = Object.keys(args);

			// loop through each requeset header and see if it's in the list of season_variables_headers
			request_headers.forEach(function(each_header, index) {

				// if request_header is not one of season_variable headers, remove from args json to update
				if (season_variables_headers.includes(each_header) === false) {

					// add bad_header request to bad_header_requests list
					bad_header_requests.push(each_header);
					
					delete args[each_header];
				}

				// once all request_headers have been checked, callback
				if (index === request_headers.length - 1) {
					callback1(bad_header_requests);
				}

			}) // end of request_headers forEach
		}) // end of find
	} // end of verify_request_headers function

	// function that converts string "true" and "false" values to boolean type
	function convert_to_boolean(callback2) {

		// make list of request headers	
		let request_headers = Object.keys(args);

		// loop through each requeset header and see if it's in the list of season_variables_headers
		request_headers.forEach(function(each_header, index) {

			// if equal to string "true", make equal to boolean true
			if (args[each_header] === "true") {
				args[each_header] = (args[each_header] === "true")
			}

			// if equal to string "false", make equal to boolean false
			if (args[each_header] === "false") {
				args[each_header] = (args[each_header] !== "false")
			}

			// once all values are converted to boolean, callback
			if (index === request_headers.length - 1) {
				callback2();
			}

		}) // end of request_headers forEach		
	} // end of convert_to_boolean function

	// function that converts string values of certain headers to integers
	function convert_to_integer(callback3) {

		// set list of headers whose values need to be converted to strings to integers
		let integer_field_header_list = ["football_completed_matchups", "basketball_completed_matchups", "baseball_completed_matchups", "football_ahead_completed_matchups"];

		// loop through each of the key headers 
		integer_field_header_list.forEach(function(header_value, index) {

			// if one of these integer field headers is in the request, then convert to integer
			if (args[header_value] !== undefined) {
				args[header_value] = parseInt(args[header_value])
			}

			// once all of the integer_field headers are done, callback
			if (index === integer_field_header_list.length - 1) {
				callback3();
			}

		})  // end of integer_field_header_list loop
	} // end of convert_to_integer function

	// function that updates season_variables collection with appropriately formatted fields
	function update_season_variables(bad_header_requests) {

		// update existing fields wtih new values
		db.collection('season_variables').update({}, {"$set": args}, {upsert: false}, function(err, number_affected) {
			console.log("Season variables modified");
			
			// send back to routes and re-load Mongodb connection and variables
			final_callback(args, bad_header_requests);
		});
	}

// Asynchronous script to go through all asynchronous functions to update season_variables
verify_request_headers(function(bad_header_requests) {

	convert_to_boolean(function() {

		convert_to_integer(function() {

			update_season_variables(bad_header_requests);
		
		}); // end of async update_season_variables function
	}); // end of async convert_to_boolean function
}); // end of async verify_request_headers function

} // end of modify_season_variables function


function add_team_name(req, res, db, args) {

	let owner_number = args.owner_number;
	let team_name = args.team_name;

	// if owner_number of team_name request header is empty or undefined
	if ((owner_number === undefined || team_name === undefined) || (owner_number === "" || team_name === "")) {
		console.log("Missing owner_number or team_name request header.");
		res.status(400).send({"message": "Missing owner_number or team_name request header"});
	}

	else {

		let options = {
			args: [owner_number, team_name]
		};

		pyshell.run('python/add_team_name.py', options, function(err) {
			if (err) throw err;
			console.log("python script complete. Name Added");

			res.status(200).send({"message": team_name + " successfully added!"});
		}); // end of pyshell script
	} // end of else successful request
}


module.exports = {
	get_season_variables,
	modify_season_variables,
	add_team_name
}