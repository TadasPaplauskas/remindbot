function Reminders()
{
    var mongoose,
        messenger,
        chrono;

    var self = {};

    self.init = function (dependencies)
    {
        mongoose = dependencies.mongoose;
        messenger = dependencies.messenger;
        chrono = dependencies.chrono;

        /* prepare models */
        var Reminder = mongoose.model('Reminder', mongoose.Schema({
            text: String,
            sender: Object,
            remind_at: Date,
            completed: Boolean,
            archived: Boolean,
            created_at: Date,
            reported: Boolean
        }));

        // run reminders schedule
        self.runSchedule(Reminder);
    };

    /* get remind_at based on string and reference date. Return null if couldn't parse. */
    self.getDateTime = function (string, message)
    {
        var referenceDate;

        // implements shorhands for morning, noon, afternoon, evening, midnight
        string = string.replace('morning', '8:00')
            .replace('noon', '12:00')
            .replace('afternoon', '16:00')
            .replace('evening', '20:00')
            .replace('midnight', '00:00');

        if (message !== undefined)
        {
            referenceDate = new Date(message.timestamp);
            referenceDate.setUTCHours(referenceDate.getUTCHours() + message.timezone);
        }
        return chrono.parseDate(string, referenceDate);
    };

    /* storing reminder in database (either complete or incomplete) */
    self.store = function (data)
    {
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
        .save(function (err, reminder)
        {
            if (err) throw err;

            if (!reminder.completed) // request more details to complete setting date
            {
                messenger.requestClarification(reminder);
            }
            else
            {
                self.report(reminder);
            }
        });
    };

    self.report = function (reminder, skip_date, next)
    {
        var dateString = '';
        if (reminder.remind_at && !skip_date)
            dateString = ' at ' + reminder.remind_at.toLocaleString();

        messenger.sendButtonsMessage(reminder.sender.id, reminder.text + dateString + '.',
        {
            type: 'postback', // alt web_url
            title: 'Cancel',
            payload: 'cancel_'+ reminder._id
        },
        next);
    };

    self.updateLastOne = function (conditions, data)
    {
        Reminder.findOneAndUpdate(
            conditions,
            {$set: data },
            { sort: { created_at: -1 }, new: true },
            function (err, reminder)
            {
                if (err) throw err;

                self.report(reminder);
            });
    };

    self.cancel = function()
    {
        var message = this.message;
        Reminder.findOneAndRemove(
            {sender: { id: message.sender.id }},
            { sort: { created_at: -1 } },
            function (err, reminder)
            {
                if (reminder)
                {
                    messenger.sendTextMessage(reminder.sender.id, 'Reminder "'+ reminder.text +'" was removed.');
                }
                else
                {
                    messenger.sendTextMessage(message.sender.id, 'You have no reminders set.');
                }
            });

    };

    self.remindNextDate = function()
    {
        return true;
    };

    self.remindSoon = function (text, day, time)
    {
        var remind_at = self.getDateTime(day +' '+ time, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    self.remindIn = function (text, time)
    {
        var remind_at = self.getDateTime('after '+ time, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    self.remindTomorrow = function (text, time)
    {
        var remind_at = self.getDateTime('tomorrow '+ time, this.message);
        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };
    self.list = function()
    {
        var message = this.message;

        Reminder.find({sender: { id: message.sender.id } }).sort('remind_at').exec(function(err, reminders)
        {
            if (err) throw err;

            if (!reminders.length)
            {
                messenger.sendTextMessage(message.sender.id, 'You have no reminders set.');
                return;
            }

            // lets set timeout for each reminder to make sure they come through in order
            var index = 0;
            for (var reminder of reminders)
            {
                setTimeout(self.report, index * 100, reminder);
                index++;
            }
        });
    };

    // scheduler to run reminders
    self.runSchedule = function(Reminder)
    {
        setInterval(function(Reminder)
        {
            Reminder.find({ remind_at: { $lt: Date() }, reported: false }).exec(function(err, reminders)
            {
                if (err) throw err;

                for (var reminder of reminders)
                {

                    self.report(reminder, true, function() {
                        // mark as reported if all is fine
                        reminder.reported = true;
                        reminder.save();
                    });

                }
            });
        }, 5000, Reminder);
    };

    return self;
}

module.exports = Reminders();