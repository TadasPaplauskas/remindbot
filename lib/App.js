function App(params)
{
    var messenger = params.messenger;
    var parser = params.parser;
    var reminders = params.reminders;

    reminders.runSchedule();

    var self = {};

    // methods
    self.messengerRequest = function (body)
    {
        messenger.parseEvents(body, function (message)
            {
                 // if this is an optin
                if (message.text === 'optin')
                    self.help(message);

                // if it's just a message
                else
                    parser(message.text, patterns, messenger.noMatch, { message: message } );
            });
    };

    self.noMatch = function (text)
    {
        // maybe its a clarification for date?
        var clarifiedDate = reminders.getDateTime(text);

        if (clarifiedDate) // if we get usable date out of this
        {
            reminders.updateLastOne(
                { sender: this.message.sender.id },
                { remind_at: clarifiedDate });
        }
        else // fuck it
        {
            var reply = 'I don\'t understand you. Type "help" if you\'re even more confused than I am';
            messenger.sendTextMessage(this.message.sender.id, reply);
        }
    };

    self.help = function (message)
    {
        // get attribute from context or call arg
        var recipient = this.message ? this.message.sender.id : (message ? message.sender.id : null);

        messenger.sendTextMessage(recipient, 'I\'m RemindBot and I will remind you to do things - just ask me like you would ask a friend.');

        setTimeout(function() {
            messenger.sendTextMessage(recipient, 'Try me right now: type "Remind me to take out the trash tomorrow morning", "An appointment on august 1", or any other common way you would ask for a reminder.');
        }, 1000);

        setTimeout(function() {
        messenger.sendTextMessage(recipient, 'Type "cancel" to remove the last saved reminder or "list" to see all of them.');
        }, 2000);
    };

    // patterns
    var patterns = [
        {
            pattern: 'help',
            callback: self.help

        },
        {
            pattern: 'cancel',
            callback: reminders.cancel

        },
        {
            pattern: 'list',
            callback: reminders.list

        },
        {
            pattern: 'Remind me to {string} tomorrow$',
            callback: reminders.remindTomorrow
        },
        {
            pattern: 'Remind me to {string} (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday) {string}$',
            callback: reminders.remindSoon
        },
        {
            pattern: 'Remind me to {string} next {string}$',
            callback: reminders.remindNextDate
        },
        {
            pattern: 'Remind me to {string} in {string}$',
            callback: reminders.remindIn
        },
        {
            pattern: 'Remind me to {string} after {string}$',
            callback: reminders.remindIn
        },
        {
            pattern: '^{string} (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday) {string}$',
            callback: reminders.remindSoon
        },

        /* ... */


        // this one has to be the last
        {
            pattern: '^{string}$',
            callback: self.noMatch
        }
    ];

    return self;
}

module.exports = App;