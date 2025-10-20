#!/usr/bin/env node

/**
 * Main entry point of website
 */


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