const path = require('path');

const config = {
    env: 'development',

    server: {
        port: process.env.PORT || 8080,
    },

    debug: {
        log_path: path.join(__dirname, '..', '..', 'logs'),
    },
};

module.exports = config;
