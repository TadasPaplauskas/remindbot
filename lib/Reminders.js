function Reminders(params)
{
    if (!params.mongoose)
        throw Error('mongoose is a required dependency');
    if (!params.messenger)
        throw Error('messenger is a required dependency');
    if (!params.chrono)
        throw Error('chrono is a required dependency');

    var mongoose = params.mongoose;
    var messenger = params.messenger;
    var chrono = params.chrono;

    /* prepare models */
    var Reminder = mongoose.model('Reminder', mongoose.Schema({
        text: String,
        sender: Object,
        remind_at: Date,
        complete: Boolean,
        archived: Boolean,
        created_at: Date
    }));

    /* get remind_at based on string and reference date. Return null if couldn't parse. */
    this.getDateTime = function (string, timestamp)
    {
        return chrono.parseDate(string, new Date(timestamp));
    };

    /* storing reminder in database (either complete or incomplete) */
    this.store = function (data)
    {
        // create reminder object with text
        var reminder = new Reminder({
            text: data.text,
            sender: data.message.sender,
            remind_at: data.remind_at,
            completed: (data.remind_at ? true : false), // if remind_at null, mark Reminder as incomplete.
            message: data.message,
            created_at: new Date()
        })
        .save(function (err, reminder)
        {
            if (err) throw err;
            console.log('saved');

            if (!reminder.completed) // request more details to complete setting date
            {
                messenger.requestClarification(reminder);
            }
        });
    };

    this.remindNextDate = function ()
    {
        return true;
    };

    this.remindTomorrow = function (text, time)
    {
        var remind_at = self.getDateTime('tomorrow '+ time, this.message.timestamp);

        self.store({
            message: this.message,
            remind_at: remind_at,
            text: text
        });
    };

    this.list = function()
    {
        var receiver = this.message.sender.id;

        Reminder.find({}).sort({ remind_at: 1 }).exec(function (err, reminders)
        {
            if (err) throw err;

            for (var reminder of reminders)
            {
                messenger.sendTextMessage(receiver, reminder.text +' at '+ reminder.remind_at);
            }
        });
    };

    this.cancel = function()
    {
        Reminder.find({}).sort({ created_at: -1 }).limit(1).exec(function (err, reminders)
        {
            console.log(reminders);
        });

    };

    return this;
}

module.exports = Reminders;