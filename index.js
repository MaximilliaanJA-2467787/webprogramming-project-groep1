<<<<<<< HEAD
#!/usr/bin/env node

=======
>>>>>>> 2497bbc5e92e57340a93634048eb9ddb61e98ad9
/**
 * Main entry point of website
 */

<<<<<<< HEAD

const app = require('./app');

const config = require('./app/config/config')

const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.env}`);
});


// Gracefull shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});


module.exports = server;
=======
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
>>>>>>> 2497bbc5e92e57340a93634048eb9ddb61e98ad9
