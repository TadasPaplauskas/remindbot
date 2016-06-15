function Messenger(params)
{
    if (!params.request)
        throw Error('request is a required dependency');

    if (!params.config)
        throw Error('No messenger configuration was passed');

    if (!params.mongoose)
        throw Error('mongoose is a required dependency');

    var config = params.config;
    var request = params.request;
    var mongoose = params.mongoose;

    /* prepare models */
    var Message = mongoose.model('Message', mongoose.Schema({
        sender:     Object,
        text:       String,
        timestamp:  String,
        created_at: Date
    }));

    this.parseEvents = function(body)
    {
        if (body.entry === undefined)
            return false;

        var messages = [];

        for (var entry of body.entry)
        {
            for (var message of entry.messaging)
            {
                stored = new Message({
                    sender:     message.sender,
                    text:       message.message.text,
                    timestamp:  entry.time,
                    created_at: new Date()
                });//.save();

                messages.push(stored);
            }
        }
        return messages;
    };

    this.sendTextMessage = function(recipient, text) {
        var messageData = {
            text:text
        };

        request({
            url: config.url + '/messages',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
              recipient: { id: recipient },
              message: messageData,
            }
        }, function(error, response, body)
        {
            if (error) {
                console.error('Error sending message: ', error);
            } else if (response.body.error) {
                console.error('Error: ', response.body.error);
            }
        });
    };

    this.noMatch = function(message)
    {
        //console.log(message);
        /*this.sendTextMessage(this.message.sender,
            'Sorry, I could not understand "'+ this.message.text +'"');*/

        return true;
    };

    this.requestClarification = function(reminder)
    {
        var reply = 'I\'m confused. When exactly should I remind you to '+ reminder.text + '?';

        self.sendTextMessage(reminder.sender.id, reply);
        //self.storeReply(reminder.message);
    };

    return this;
}

module.exports = Messenger;