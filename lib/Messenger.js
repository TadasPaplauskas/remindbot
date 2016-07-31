function Messenger(params)
{
    // lib dependencies to init
    var config,
        request,
        mongoose,
        parser,
        reminders,
        Message;

    var self = {};

    self.init = function (dependencies)
    {
        config = dependencies.config;
        request = dependencies.request;
        mongoose = dependencies.mongoose;
        parser = dependencies.parser;
        reminders = dependencies.reminders;

        // prepare models
        Message = mongoose.model('Message', mongoose.Schema({
            sender:     Object,
            text:       String,
            timestamp:  Number,
            timezone:   Number,
            created_at: Date
        }));

        // set "get started" button payload
        request({
            url: config.url + 'me/thread_settings',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
                setting_type: "call_to_actions",
                thread_state: "new_thread",
                call_to_actions: [
                    {
                        payload: "Hello"
                    }
                ]
            }
        }, function (error, response, body)
        {
            if (error) throw error;

            console.log(body); // show the response for debugging purposes
        });

        // set the persistent menu
        request({
            url: config.url + 'me/thread_settings',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
                setting_type: "call_to_actions",
                thread_state: "existing_thread",
                call_to_actions: [
                    {
                        type: "postback",
                        title: "List",
                        payload: "list"
                    },
                ]
            }
        }, function (error, response, body)
        {
            if (error) throw error;

            console.log(body); // show the response for debugging purposes
        });

        // set a greeting on initialization
        // this will only be displayed before the first interaction with user
        request({
            url: config.url + 'me/thread_settings',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
                setting_type: "greeting",
                greeting: { text: "Hi!" } // Type \"help\" or click \"Get started\" if you're new at this.
            }
        }, function (error, response, body)
        {
            if (error) throw error;

            console.log(body); // show the response for debugging purposes
        });
    };

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
                // it's a postback
                if (message.postback !== undefined)
                {
                    text = message.postback.payload;
                }
                // it's a sticker - yeah okay
                else if (message.message !== undefined && message.message.sticker_id !== undefined)
                {
                    text = 'sticker';
                }
                else if (message.message !== undefined)
                {
                    text = message.message.text;
                }
                else if (message.optin !== undefined)
                {
                    text = 'optin';
                }
                else
                {
                    continue;
                }

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

    self.sendButtonsMessage = function(recipient, text, buttons, next)
    {
        var data = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: text,
                    buttons: buttons
                }
            }
        };

        request({
            url: config.url + 'me/messages',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
              recipient: { id: recipient },
              message: data,
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

    self.sendTextMessage = function(recipient, text, next) {
        var data = {
            text: text
        };

        request({
            url: config.url + 'me/messages',
            qs: { access_token: config.token },
            method: 'POST',
            json: {
              recipient: { id: recipient },
              message: data,
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
        this.sendTextMessage(this.message.sender,
            'Sorry, I could not understand "'+ this.message.text +'"');

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

module.exports = Messenger();