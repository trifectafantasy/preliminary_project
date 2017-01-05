var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

var router = require('./app/routes.js');
app.use('/', router);


app.listen('8081');

console.log('Magic happens on port 8081');
