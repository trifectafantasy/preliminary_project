// Example JavaScript to review Asynchronous calls
var mongo_url = 'mongodb://localhost:27017/espn';


////// DEFINE FUNCTIONS //////

function start(mongo_url) {

	// Print after start function starts
	console.log("START!")
	var mongo = require('mongodb');
	var assert = require('assert');

	var MongoClient = mongo.MongoClient;

	MongoClient.connect(mongo_url, function(err, db) {

		assert.equal(null, err);

		// Prints after .connect async function starts
		console.log("First!");

		readCollection(db, function(array){
			// Prints after readCollection is finished
			console.log("Until now!");

			//console.log(array);
			db.close();
			return array;
		})

		// Prints after readCollection is kicked off, no matter status of readCollection
		console.log("How long did the function take?")
	})

}


function readCollection(db, callback) {
		// Prints after readCollection is started
		console.log("Function starts right away, but doesn't finish....")

		db.collection('baseball_2016_h2h').find({}, {"_id": 0}, {"sort": [['division', 'asc'], ['win_per', 'desc']]}).toArray(function(err, cursor1){
			callback(cursor1);
	})
}



 ///// EXECUTE SCRIPT ////////

start(mongo_url)

console.log("This starts RIGHT after the start function")