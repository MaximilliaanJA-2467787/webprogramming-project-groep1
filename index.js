/**
 * Main entry point of website
 */

const app = require('./app');
const Logger = require('./app/utils/Logger');


// Init the app
app.init();



// Load middleware and routes
app.bindPreMiddlewares();
app.bindRoutes();
app.bindPostMiddlewares();

// Start listening
const server = app.listen();

// Handle ctrl+c termination
process.on('SIGTERM', () => {
    Logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        Logger.info('Process terminated');
        process.exit(0);
    });
});

module.exports = server;
