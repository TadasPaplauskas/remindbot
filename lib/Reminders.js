function Reminders() {
    // lib dependencies to init
    var mongoose,
        messenger,
        chrono,
        Reminder;

    var self = {};

    self.init = function (dependencies) {
        mongoose = dependencies.mongoose;
        messenger = dependencies.messenger;
        chrono = dependencies.chrono;

        /* prepare models */
        Reminder = mongoose.model('Reminder', mongoose.Schema({
            text: String,
            sender: Object,
            remind_at: Date,
            completed: Boolean,
            message: Object,
            created_at: Date,
            reported: Boolean
        }));

        // run reminders schedule
        self.runSchedule(Reminder);
    };

    /* get remind_at based on string and reference date. Return null if couldn't parse. */
    self.getDateTime = function (string, message) {
        var referenceDate;

        // implements shorhands for morning, noon, afternoon, evening, midnight
        string = string.replace('morning', '8:00')
            .replace('afternoon', '16:00')
            .replace('noon', '12:00')
            .replace('evening', '20:00')
            .replace('midnight', '00:00');

        // special case: something on tuesday the 9th at 11:22
        if (string.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday) the (.*?)$/i)) {
            var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            var currentMonth = new Date().getMonth();

            string = string.replace(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, monthNames[currentMonth])
                .replace('the', '');
        }

        if (message !== undefined) {
            // get into local user time for calculation
            referenceDate = new Date(message.timestamp + message.timezone * 3600 * 1000);
        }
        var parsedDate = chrono.parseDate(string, referenceDate);

        // rollback the difference back to UTC
        if (parsedDate) {
            parsedDate = new Date(parsedDate.getTime() - message.timezone * 3600 * 1000);
            // round up the seconds
            parsedDate.setSeconds(0);
        }
        return parsedDate;
    };

    /* storing reminder in database (either complete or incomplete) */
    self.store = function (data) {
        // create reminder object with text
        var reminder = new Reminder({
            text: data.text,
            sender: data.message.sender,
            remind_at: (data.remind_at ? data.remind_at : null),
            completed: (data.remind_at ? true : false), // if remind_at null, mark Reminder as incomplete.
            message: data.message,
            created_at: new Date(),
            reported: false
        })
        .save(function (err, reminder) {
            if (err) throw err;

            // request more details to complete setting date
            if (!reminder.completed) {
                messenger.requestClarification(reminder);
            } else {
                self.report(reminder);
            }
        });
    };

    self.report = function (reminder, skipDateAndCancelButton, next) {
        if (!reminder)
            return;

        var dateString = '';
        if (reminder.remind_at && !skipDateAndCancelButton) {
            // adjust display date time based on a timezone
            var displayDate = new Date(reminder.remind_at.getTime() + reminder.message.timezone * 3600 * 1000);
            dateString = ' on ' + displayDate.toLocaleString().replace(':00 ', ' ');
        }

        if (skipDateAndCancelButton) {
            messenger.sendTextMessage(reminder.sender.id, reminder.text + dateString + '.', next);
        } else {
            messenger.sendButtonsMessage(reminder.sender.id, reminder.text + dateString + '.',
            [{
                type: 'postback', // alt web_url
                title: 'Cancel "'+ reminder.text +'"',
                payload: 'cancel_'+ reminder._id
            }],
            next);
        }
    };

    self.updateLastOne = function (conditions, data, next) {
        Reminder.findOneAndUpdate(conditions, {$set: data }, { sort: { created_at: -1 }, new: true }, next);
    };

    self.findLastOne = function (conditions, next) {
        Reminder.findOne(conditions).sort({ created_at: -1 }).exec(next);
    };

    self.cancel = function() {
        var message = this.message;
        Reminder.findOneAndRemove( {
                sender: { id: message.sender.id },
                reported: false
            },
            { sort: { created_at: -1 } },
            function (err, reminder) {
                if (err) throw err;

                if (reminder) {
                    messenger.sendTextMessage(reminder.sender.id, '"'+ reminder.text +'" was removed.');
                } else {
                    messenger.sendTextMessage(message.sender.id, 'You have no reminders set.');
                }
            });
    };

    self.cancelById = function(_id) {
        var message = this.message;
        Reminder.findOneAndRemove( {
                _id: _id ,
                reported: false
            },
            null,
            function (err, reminder) {
                if (err) throw err;

                if (reminder) {
                    messenger.sendTextMessage(reminder.sender.id, '"'+ reminder.text +'" was removed.');
                } else {
                    messenger.sendTextMessage(message.sender.id, 'This reminder is already gone.');
                }
            });
    };

    self.dateSeparatorReminderTime = function(date, separator, text, time) {
        var remind_at = self.getDateTime(date + ' ' + time, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    self.dayReminderTime = function(day, text, time) {
        var remind_at = self.getDateTime(day + ' ' + time, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    self.remindOnDateWithSeparator = function(separator, text, word, datetime) {
        var remind_at = self.getDateTime(datetime, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    self.remindSoonWithSeparator = function(separator, text, day, time) {
        // chrono does not understand "after" very well
        day = day.replace('after', 'in');

        var remind_at = self.getDateTime(day +' '+ time, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    self.remindSoonWithoutSeparator = function(text, day, time) {
        self.remindSoonWithSeparator.call(this, null, text, day, time);
    };

    self.remindIn = function(text, time) {
        var remind_at = self.getDateTime('after '+ time, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    self.remindIncomplete = function(separator, text) {
        self.store({
            message: this.message,
            text: text
        });
    };

    self.list = function() {
        var message = this.message;

        Reminder.find({sender: { id: message.sender.id }, reported: false }).sort('remind_at').exec(function(err, reminders) {
            if (err) throw err;

            if (!reminders.length) {
                messenger.sendTextMessage(message.sender.id, 'You have no reminders set.');
                return;
            }

            // lets set timeout for each reminder to make sure they come through in order
            var index = 0;
            for (var reminder of reminders) {
                setTimeout(self.report, index * 300, reminder);
                index++;
            }
        });
    };

    // scheduler to run reminders
    self.runSchedule = function(Reminder) {
        setInterval(function(Reminder) {
            Reminder.find({ remind_at: { $lt: Date() }, reported: false }).exec(function(err, reminders) {
                    if (err) throw err;

                    for (var reminder of reminders) {
                        self.report(reminder, true, function() {
                            // mark as reported if all is fine
                            reminder.reported = true;
                            reminder.save();
                        });
                    }
            });
        }, 3000, Reminder);
    };

    return self;
}

module.exports = Reminders();