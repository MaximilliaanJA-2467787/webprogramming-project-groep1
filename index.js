/**
 * Main entry point of website
 */

// Set the app
const app = require('./app');
const Logger = require('./app/utils/Logger');

// Start listening
const server = app.listen();

// Handle ctrl+c termination
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        Logger.info('Process terminated');
        process.exit(0);
    });
});

module.exports = server;
