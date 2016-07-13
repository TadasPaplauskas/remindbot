var config = {};

config.mongodb = {
    url: process.env.MONGODB_URL || 'mongodb_url'
};
config.web = {
    port: process.env.WEB_PORT || 8000
};

config.messenger = {
    token: 'messenger_token',
    url: 'fb_graph_api_url'
};

module.exports = config;