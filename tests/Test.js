// tests to verify that patterns work as intended

// node tests/Test.js
// dependencies
var test = require('tape');
var parser = require('pattern-parser');
var app = require('../lib/App');

// prepare a mock.
// All the same functions as in original object, but they return function name
var reminders = {};
Object.keys(require('../lib/Reminders')).forEach((key) => {
    reminders[key] = (...args) => { return { args, fn: key }; };
});

// prepare app object
app.init({
        messenger: {},
        parser: parser,
        reminders: reminders
    });

// tests

test('Parse "list"', (t) => {
    let parsed = parser('list',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['list']);
    t.equal(parsed.fn, 'list', 'should call reminders.list()');
    t.end();
});

test('Parse "cancel"', (t) => {
    let parsed = parser('cancel',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['cancel']);
    t.equal(parsed.fn, 'cancel', 'should call reminders.cancel()');
    t.end();
});

test('Parse "Remind me about something tomorrow morning"', (t) => {
    let parsed = parser('Remind me about something tomorrow morning',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, [' me about ', 'something', 'tomorrow', 'morning']);
    t.equal(parsed.fn, 'remindSoonWithSeparator',
        'should call reminders.remindSoonWithSeparator()');
    t.end();
});

test('Parse "Reminder to do something in 1 hour"', (t) => {
    let parsed = parser('Reminder to do something in 1 hour',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['er to ', 'do something', 'in', '1 hour']);
    t.equal(parsed.fn, 'remindSoonWithSeparator',
        'should call reminders.remindSoonWithSeparator()');
    t.end();
});

test('Parse "Remind me something"', (t) => {
    let parsed = parser('Remind me something',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, [' me ', 'something']);
    t.equal(parsed.fn, 'remindIncomplete',
        'should call reminders.remindIncomplete()');
    t.end();
});

test('Parse "Remind something next saturday"', (t) => {
    let parsed = parser('Remind something next saturday',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, [' ', 'something', 'next saturday']);
    t.equal(parsed.fn, 'remindIncomplete',
        'should call reminders.remindIncomplete()');
    t.end();
});

test('Parse "Tomorrow: meet someone at 12:00"', (t) => {
    let parsed = parser('Tomorrow: meet someone at 12:00',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['Tomorrow', ':', 'meet someone', '12:00']);
    t.equal(parsed.fn, 'dateSeparatorReminderTime',
        'should call reminders.dateSeparatorReminderTime()');
    t.end();
});

test('Parse "Next monday something at 12:00', (t) => {
    let parsed = parser('Next monday something at 12:00',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['Next monday', 'something', '12:00']);
    t.equal(parsed.fn, 'dayReminderTime',
        'should call reminders.dayReminderTime()');
    t.end();
});

test('Parse "Something at 5pm"', (t) => {
    let parsed = parser('Something at 5pm',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['Something', 'at', '5pm']);
    t.equal(parsed.fn, 'remindSoonWithoutSeparator',
        'should call reminders.remindSoonWithoutSeparator()');
    t.end();
});

test('Parse "Something next friday afternoon"', (t) => {
    let parsed = parser('Something next friday afternoon',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['Something', 'next friday', 'afternoon']);
    t.equal(parsed.fn, 'remindSoonWithoutSeparator',
        'should call reminders.remindSoonWithoutSeparator()');
    t.end();
});

test('Parse "Something in 1 hour"', (t) => {
    let parsed = parser('Something in 1 hour',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['Something', 'in', '1 hour']);
    t.equal(parsed.fn, 'remindSoonWithoutSeparator',
        'should call reminders.remindSoonWithoutSeparator()');
    t.end();
});


test('Parse "Something september 14th 4pm"', (t) => {
    let parsed = parser('Something september 14th 4pm',
        app.getPatterns(), // get current patterns
        () => { t.end(); return false; } // default method
    );

    // check if parsing was successful
    t.deepEqual(parsed.args, ['Something', 'september', '14th 4pm']);
    t.equal(parsed.fn, 'remindSoonWithoutSeparator',
        'should call reminders.remindSoonWithoutSeparator()');
    t.end();
});