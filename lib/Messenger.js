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

    // set a greeting on initialization
    // this will only be displayed before the first interaction with user
    request({
            url: config.url + 'me/thread_settings',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
                "setting_type":"greeting",
                "greeting": { "text":"Hi! Type \"help\" if you're new at this" }
            }
        });

    // prepare models
    var Message = mongoose.model('Message', mongoose.Schema({
        sender:     Object,
        text:       String,
        timestamp:  Number,
        timezone:   Number,
        created_at: Date
    }));

    var self = {};

    self.parseEvents = function(body, callback)
    {
        if (body.entry === undefined)
            return false;

        var text,
            newMessage;

        for (var entry of body.entry)
        {
            for (var message of entry.messaging)
            {
                if (message.message !== undefined)
                    text = message.message.text;
                else if (message.optin !== undefined)
                    text = 'optin';
                else
                    continue;

                newMessage = new Message({
                    sender:     message.sender,
                    text:       text,
                    timestamp:  message.timestamp,
                    created_at: new Date()
                });

                //get message timezone - very important!
                request({
                    url: config.url + message.sender.id,
                    qs: { access_token: config.token, fields: 'timezone' },
                    method: 'GET'
                }, function(error, response, data)
                {
                    if (error) {
                        console.error('Error getting user info: ', error);
                    } else if (response.body.error) {
                        console.error('Error: ', response.body.error);
                    }
                    var data = JSON.parse(data);
                    newMessage.timezone = data.timezone;

                    newMessage.save();

                    callback(newMessage);
                });
            }
        }
    };

    self.sendTextMessage = function(recipient, text, next) {
        var messageData = {
            text:text
        };

        request({
            url: config.url + 'me/messages',
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
            else if (next)
            {
                next();
            }
        });
    };

    self.noMatch = function(message)
    {
        //console.log(message);
        /*this.sendTextMessage(this.message.sender,
            'Sorry, I could not understand "'+ this.message.text +'"');*/

        return true;
    };

    self.requestClarification = function(reminder)
    {
        var reply = 'I\'m confused. When exactly should I remind you to '+ reminder.text + '?';

        self.sendTextMessage(reminder.sender.id, reply);
        //self.storeReply(reminder.message);
    };


    //return the function object
    return self;
}

module.exports = Messenger;