///// IMPORT JAVASCRIPT PACKAGES //////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var pyshell = require('python-shell');

var mongo = require('mongodb');
var assert = require('assert');

module.exports = function(req, res, db, sport, year, callback) {

	var owner_list = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

	var complete_count = 0;
	var total_count = 0;

	db.collection(sport + "_acquisitions_" + year + "_all").remove({}, function(err, results) {
	
		owner_list.forEach(function(owner_number, index) {

			db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).count({}, function(err, num) {
				total_count += num;

			})			

			db.collection("owner" + owner_number + "_" + sport + "_acquisitions_" + year).find({}, {"_id": 0}).toArray(function(e, docs) {
				
				//console.log(docs);
				var team_pull = docs;

				db.collection("owner" + owner_number).find({}, {"owner": 1, "_id": 0}).toArray(function(err, owner_name) {
					owner = owner_name[0]["owner"];
					//console.log(owner);

					for (i = 0; i < team_pull.length; i++) {
						//console.log(team_pull[i]);

						var player_pull = team_pull[i];

						player_pull["owner"] = owner;

						//console.log(player_pull);

						db.collection(sport + "_acquisitions_" + year + "_all").insert(player_pull);
						complete();
					}				
				})

			})


		})


	})

var complete = function() {
	complete_count += 1;

	if (complete_count != 0 && total_count != 0) {
		if (complete_count == total_count) {
			//console.log("donezo")
			callback();
		}		
	}


}
	

}