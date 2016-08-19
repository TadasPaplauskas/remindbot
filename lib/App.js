function App() {
    // lib dependencies to init
    var messenger,
        parser,
        reminders,
        patterns;

    var self = {};

    self.init = function (dependencies) {
        messenger = dependencies.messenger;
        parser = dependencies.parser;
        reminders = dependencies.reminders;

        // patterns
        patterns = [
            {
                pattern: '^(help|hello|hi|hey)$',
                callback: self.help

            },
            {
                pattern: '^(ok|okay|k|great|sticker)$',
                callback: self.ok

            },
            {
                pattern: '^(cancel|forget|forget it|abort|nevermind)$',
                callback: reminders.cancel

            },
            {
                pattern: '^(list|show|all)$',
                callback: reminders.list

            },
            // most specific patterns should go to the top
            {
                pattern: 'Remind(er to |er | me to | me about | me | about | to | ){string} (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday)$',
                callback: reminders.remindIncomplete
            },
            {
                pattern: '^Remind(er to |er | me to | me about | me | about | to | ){string} (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday|in|after|next) {string}$',
                callback: reminders.remindSoonWithSeparator
            },
            {
                pattern: '^Remind(er to |er | me to | me about | me | about | to | ){string} (on|at|in) {string}$',
                callback: reminders.remindOnDateWithSeparator
            },
            {
                pattern: 'Remind(er to |er | me to | me about | me | about | to | ){string}$',
                callback: reminders.remindIncomplete
            },
            {
                pattern: '^{string}(:| -) {string} at {string}$',
                callback: reminders.dateSeparatorReminderTime
            },
            {
                pattern: '^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday) {string} at {string}$',
                callback: reminders.dayReminderTime
            },
            {
                pattern: '^{string} (on|at|in) {string}$',
                callback: reminders.remindOnDateWithoutSeparator
            },
            {
                pattern: '^{string} (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday|in|after|next) {string}$',
                callback: reminders.remindSoonWithoutSeparator
            },


            /* POSTBACKS */
            {
                pattern: "^cancel_{string}$",
                callback: reminders.cancelById
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

    self.getPatterns = function () {
        return patterns;
    };

    self.messengerRequest = function (body) {
        messenger.parseEvents(body, function (message)
            {
                 // if this is an optin
                if (message.text === 'optin' || message.text === undefined) {
                    self.help(message);
                } else { // if it's just a message
                    parser(message.text, patterns, messenger.noMatch, { message: message } );
                }
            });
    };

    self.noMatch = function (text) {
        var message = this.message;

        // maybe its a clarification for date?
        var clarifiedDate = reminders.getDateTime(text, message);

        // if we get usable date out of this
        if (clarifiedDate) {
            reminders.updateLastOne({ 'sender.id': message.sender.id }, { remind_at: clarifiedDate }, function(err, reminder) {
                    if (err) throw err;

                    if (reminder && reminder.remind_at)
                    {
                        reminder.completed = true;
                        reminder.save();
                    }
                    reminders.report(reminder);
                });
        } else { // whatever
            reminders.findLastOne({ 'sender.id': message.sender.id }, function(err, reminder) {
                if (err) throw err;

                if (reminder && !reminder.completed) {
                    messenger.requestClarification(reminder);
                } else {
                    messenger.sendTextMessage(message.sender.id, 'Sorry, you need to be more specific. Type "help" if you are lost.');
                }
            });
        }
    };

    self.help = function (message) {
        // get attribute from context or call arg
        var recipient = this.message ? this.message.sender.id : (message ? message.sender.id : null);

        messenger.sendTextMessage(recipient,
            'Hi! My name is RemindBot and I can remind you to do things - just ask me like you would ask a friend.');

        setTimeout(function() {
            messenger.sendTextMessage(recipient,
                'Try me right now - type:\n' +
                '"Remind me to take out the trash tomorrow morning"\n' +
                'or\n' +
                '"Dentist appointment on august 1 15:30"\n' +
                'or\n' +
                '"Call Jack next monday afternoon"\n' +
                'or something similar - RemindBot will try it\s best. FYI - it understands words like "next tuesday", "tomorrow", "morning", "afternoon", ect.');
        }, 250);

        setTimeout(function() {
            messenger.sendTextMessage(recipient,
                'Other commands available to you:\n' +
                '"cancel/abort/forget" - remove the last saved (completed or not) reminder.\n' +
                '"list/show/all" - see all the scheduled reminders\n' +
                '"help/hi/hello" - see these instructions again.');
        }, 500);
    };

    self.ok = function () {
        var recipient = this.message.sender.id;

        messenger.sendTextMessage(recipient,
            '(y)');
    };
    return self;
}

module.exports = App();