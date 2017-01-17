//require express
/*

*/
var mongo_url = 'mongodb://localhost:27017/espn';


function start(mongo_url) {

	var mongo = require('mongodb');
	var assert = require('assert');

	var MongoClient = mongo.MongoClient;

	MongoClient.connect(mongo_url, function(err, db) {

	assert.equal(null, err);

	console.log("client connected");

	readCollection(db, function(array){
		console.log("did i get the array???")
		console.log(array);
		//alert(array);
		//document.getElementbyId("hello").innerHTML = array;
		return array;
	})

	db.close();

})

}


function readCollection(db, callback) {

		var cursor1 = db.collection('baseball_2016_h2h').find({}, {"_id": 0}, {"sort": [['division', 'asc'], ['win_per', 'desc']]}).toArray(function(err, cursor1){
			callback(cursor1);
	})
}

document.getElementById("hello").innerHTML = start(mongo_url);