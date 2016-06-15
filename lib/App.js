function App(params)
{
    var messenger = params.messenger;
    var parser = params.parser;
    var reminders = params.reminders;


    this.messengerRequest = function (body)
    {
        var messages = messenger.parseEvents(body);

        if (!messages)
            return false;

        for (var message of messages)
        {
            parser(message.text, patterns, messenger.noMatch, { message: message } );
        }
        return true;
    };

    this.noMatch = function (text)
    {
        // maybe its a clarification for date?


        // fuck it
        var reply = 'I don\'t understand you. Type "help" if you\'re even more confused than I am';
        messenger.sendTextMessage(this.message.sender.id, reply);
    };

    this.help = function ()
    {
        var recipient = this.message.sender.id;

        messenger.sendTextMessage(recipient, 'I\'m RemindBot and I will remind you to do things - just ask me like you would ask a friend.');

        setTimeout(function() {
            messenger.sendTextMessage(recipient, 'Try me right now: type "Remind me to take out the trash tomorrow morning", "An appointment on august 1", or any other common way you would ask for a reminder.');
        }, 5000);

        setTimeout(function() {
        messenger.sendTextMessage(recipient, 'Type "cancel" to remove the last saved reminder or "list" to see all of them in a presentable manner.');
        }, 10000);
    };

    // patterns
    var patterns = [
        {
            pattern: 'help',
            callback: this.help

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
            pattern: 'Remind me to {string} tomorrow {string}$',
            callback: reminders.remindTomorrow
        },
        {
            pattern: 'Remind me to {string} next {string}$',
            callback: reminders.remindNextDate
        },
        /* ... */


        // this one has to be the last
        {
            pattern: '^{string}$',
            callback: this.noMatch
        }
    ];

    return this;
}

module.exports = App;