///// IMPORT JAVASCRIPT PACKAGES /////
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'pug');
app.set('views', './views');

// routes for our app
const router = require('./app/routes/routes.js');
app.use('/', router);

// set static files (css, images, etc)
app.use(express.static(__dirname + '/public'));

// listen on port 8081
app.listen('8081');
console.log('Magic happens on port 8081');