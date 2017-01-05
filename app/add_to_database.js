// Script to insert document into Mongodb

// require appropriate libraries
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var mongo_url = 'mongodb://localhost:27017/espn';
var assert = require('assert');

var add_to_database = function() {

	MongoClient.connect(mongo_url, function(err, db) {

	    assert.equal(null, err);
	  
	    insertDocument(db, function() {
	        
	        db.close();
	    });
	});

	var insertDocument = function(db, callback) {

		var collection = db.collection('bball_2017_standings');

		collection.insert(json, function(err, result) {
		    
		    assert.equal(err, null);
		    assert.equal(1, result.result.n);
		    console.log("A document was inserted into the collection");
		    
		    callback(result);
		});
	}
}