#!/usr/bin/env node
'use strict';

var config = require('./config');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');
var parser = require('pattern-parser');
var chrono = require('chrono-node');

mongoose.connect(config.mongodb.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb error:'));
db.once('open', function()
{
    console.log('mongodb connected');

    // components of the system
    var messenger = require('./lib/Messenger');
    var reminders = require('./lib/Reminders');
    var app = require('./lib/App');

    // inject dependencies
    messenger.init({
        mongoose: mongoose,
        config: config.messenger,
        request: request,
        parser: parser
    });
    reminders.init({
        mongoose: mongoose,
        messenger: messenger,
        chrono: chrono
    });
    app.init({
        messenger: messenger,
        parser: parser,
        reminders: reminders
    });

    // web server
    var server = express();

    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.use(express.static('docs'));

    /*** messenger bot entry point ***/
    server.post('/messenger', function (req, res)
    {
        console.log(JSON.stringify(req.body));
        app.messengerRequest(req.body);
        res.sendStatus(200);
    });

    server.listen(config.web.port, function ()
    {
        console.log('Listening on port '+ config.web.port +' in '+ process.env.NODE_ENV +' mode');
    });
});

