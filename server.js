///// IMPORT JAVASCRIPT PACKAGES /////
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

app.set('view engine', 'pug');
app.set('views', './views');

// routes for our app
var router = require('./app/routes/routes.js');
app.use('/', router);

// set static files (css, images, etc)
app.use(express.static(__dirname + '/public'));

// listen on port 8081
app.listen('8081');
console.log('Magic happens on port 8081');