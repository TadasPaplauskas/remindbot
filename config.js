var config = {};

config.mongodb = {
    url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/remindbot'
};
config.web = {
    port: process.env.PORT || 3000
};

config.messenger = {
    token: process.env.MESSENGER_TOKEN,
    url: 'https://graph.facebook.com/v2.6/'
};

module.exports = config;