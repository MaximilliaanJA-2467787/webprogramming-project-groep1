const path = require('path');

const config = {
    // Set port
    port: process.env.PORT || 8080,

    // Set environment
    env: 'development',

    // Set database path
    databasePath: path.join(__dirname, '..', 'database', 'database.db'),

    // Set routes path
    routesPath: path.join(__dirname, '..', 'routes'),

    // View engine configuration
    viewEngine: 'ejs',
    viewsPath: path.join(__dirname, '..', 'views'),

    // Static files configuration
    publicPath: path.join(__dirname, '..', 'public'),
};

module.exports = config;
