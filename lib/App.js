function App()
{
    // lib dependencies to init
    var messenger,
        parser,
        reminders,
        patterns;

    var self = {};

    self.init = function (dependencies)
    {
        messenger = dependencies.messenger;
        parser = dependencies.parser;
        reminders = dependencies.reminders;

        // patterns
        patterns = [
            {
                pattern: 'help',
                callback: self.help

            },
            {
                pattern: '^(cancel|forget|forget it|abort)$',
                callback: reminders.cancel

            },
            {
                pattern: '^(list|show|all)$',
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
                pattern: '^{string} (on|at) {string}$',
                callback: reminders.remindNextDate
            },
            {
                pattern: 'Remind me to {string} after {string}$',
                callback: reminders.remindIn
            },
            {
                pattern: '^{string} (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday) {string}$',
                callback: reminders.remindSoon
            },


            /* POSTBACKS */
            {
                pattern: "^cancel_{string}$",
                callback: reminders.removeById
            },

            /* ... */


            // this one has to be the last
            {
                pattern: '^{string}$',
                callback: self.noMatch
            }
        ];
    };

    // methods
    self.messengerRequest = function (body)
    {
        messenger.parseEvents(body, function (message)
            {
                 // if this is an optin
                if (message.text === 'optin' || message.text === undefined)
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
            var reply = 'Sorry, you need to be more specific. Type "help" if you are lost.';
            messenger.sendTextMessage(this.message.sender.id, reply);
        }
    };

    self.help = function (message)
    {
        // get attribute from context or call arg
        var recipient = this.message ? this.message.sender.id : (message ? message.sender.id : null);

        messenger.sendTextMessage(recipient,
            'Hi! My name is RemindBot and I can remind you to do things - just ask me like you would ask a friend.');

        setTimeout(function() {
            messenger.sendTextMessage(recipient,
                'Try me right now - type:\n' +
                '"Remind me to take out the trash tomorrow morning"\n' +
                'or\n' +
                '"Dentist appointment on august 1 15pm"\n' +
                'or\n' +
                '"Call Jack on monday"\n' +
                'or something similar - RemindBot will try it\s best. FYI - it understands words like "next tuesday", "tomorrow", "morning", "afternoon", ect.');
        }, 250);

        setTimeout(function() {
            messenger.sendTextMessage(recipient,
                'Other commands available to you:\n' +
                '"cancel/abort/forget" - remove the last saved (completed or not) reminder.\n' +
                '"list/show/all" - see all the scheduled reminders\n' +
                '"help" - see these instructions again.');
        }, 500);
    };
    return self;
}

module.exports = App();