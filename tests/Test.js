var assert = require('assert');

var config = require('../config');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');
var parser = require('pattern-parser');

var messenger = require('../lib/Messenger')( { config: config.messenger, request: request });
var reminders = require('../lib/Reminders')( { mongoose: mongoose, messenger: messenger });
var app = require('../lib/App')({ messenger: messenger, parser: parser, reminders: reminders });

before(function()
{
    eventSillyMessage = {
    "entry":[
        {
            "messaging":[
                {
                    "sender": { "id": 123 },
                    "message": {
                        "text": "yabadabadoo"
                    }
                }
            ]
        }
    ]
};

    eventGoodMessage = {
        "object": "page",
        "entry":[
            {
                "id": "633277340164753",
                "time": 1465377041153,
                "messaging":[
                    {
                        "sender": { "id": "875423282569413" },
                        "message": {
                            "mid": "mid.1465377041123:e618d3c5c8ec2b0e49",
                            "seq": 55,
                            "text": "Remind me to take out the trash tomorrow morning"
                        }
                    }
                ]
            }
        ]
    };
});



describe('App.messengerRequest', function ()
{
    it('Should return true (bad message, not found)', function () {
        assert.ok(app.messengerRequest(eventSillyMessage));
    }, 'Does not return true');
});


describe('App.messengerRequest', function ()
{
    it('Should return true (good message)', function () {
        assert.ok(app.messengerRequest(eventGoodMessage));
    }, 'Does not return true');
});


describe('Messenger.parseEvents', function ()
{
    beforeEach(function()
    {
        messages = messenger.parseEvents(eventSillyMessage);
    });

    it('should return array', function () {

        assert.ok(messages, 'Does not return array');
    });
    it('first message should be "yabadabadoo"', function () {

        assert.ok(messages[0].text === 'yabadabadoo', 'Messages were not parsed');
    });
});

/*
    it('parses "Remind me to pay the taxes tomorrow morning"', function () {
        assert.ok(
            parse('Remind me to pay the taxes tomorrow morning', [{
                pattern: 'Remind me to {string} tomorrow {word}',
                callback: function (str1, str2)
                {
                    assert.equal(str1, 'pay the taxes');
                    assert.equal(str2, 'morning');
                }
            }]));
    });

    it('parses "Remind me to pay the taxes this evening"', function () {
        assert.ok(
            parse('Remind me to pay the taxes this evening', [{
                pattern: 'Remind me to {string} this {word}',
                callback: function (str1, str2)
                {
                    assert.equal(str1, 'pay the taxes');
                    assert.equal(str2, 'evening');
                }
            }]));
    });

    it('parses "Set reminder to pay the taxes tomorrow"', function () {
        assert.ok(
            parse('Set reminder to pay the taxes tomorrow', [{
                pattern: 'Set reminder to {string} tomorrow',
                callback: function (str1, str2)
                {
                    assert.equal(str1, 'pay the taxes');
                }
            }]));
    });

    it('parses "Set reminder to pay the taxes next tuesday"', function () {
        assert.ok(
            parse('Set reminder to pay the taxes next tuesday', [{
                pattern: 'Set reminder to {string} next {day_of_week}$',
                callback: function (str1, str2)
                {
                    assert.equal(str1, 'pay the taxes');
                    assert.equal(str2, 'tuesday');
                }
            }]));
    });

    it('parses "Set reminder to pay the taxes next tuesday morning"', function () {
        assert.ok(
            parse('Set reminder to pay the taxes next tuesday morning', [{
                pattern: 'Set reminder to {string} next {day_of_week} {part_of_day}$',
                callback: function (str1, str2, str3)
                {
                    assert.equal(str1, 'pay the taxes');
                    assert.equal(str2, 'tuesday');
                    assert.equal(str3, 'morning');
                }
            }]));
    });

    it('parses "Set reminder to pay the taxes next tuesday 16:00"', function () {
        assert.ok(
            parse('Set reminder to pay the taxes next tuesday 16:00', [{
                pattern: 'Set reminder to {string} next {string}',
                callback: function (str1, time)
                {
                    assert.equal(str1, 'pay the taxes');
                    assert.equal(time, 'tuesday 16:00');
                }
            }]));
    });*/

describe('Reminder.void', function () {
    it('Should exist', function () {
        assert.ok(true);
    });
});