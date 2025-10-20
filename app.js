const express = require('express');
const config = require('./app/config/config');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session')
const setupLogger = require("./app/debug/logger");


// Import database
const db = require('./app/database');

// Import route loader
const loadRoutes = require('./app/routes/routing')

/**
 * App setup
 */

const app = express();

// View engine setup
app.set('view engine', config.viewEngine);
app.set('views', config.viewsPath);
app.use(expressLayouts);
app.set('layout', 'layouts/default');


/**
 * Middleware setup
 */

// Auth middleware
app.use(session(
  {
    secret: "Session-Key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60000
    },
  }
));

// Logging middleware
setupLogger(app);

// Parse JSON bodies
app.use(express.json()); 

 // Serve static files
app.use(express.static(config.publicPath));

/**
 * Database initialization
 */
db.init();

// Load Routes
loadRoutes(app);

/**
 * Default routes
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
});


app.get(/^(?!\/(css|js|images|fonts|assets)\/|\/favicon\.ico$).*/, (req, res) => {
  res.redirect('/error/404');
});



app.use((err, req, res, next) => {
  // Should never reach this due to ErrorHandler middleware registered in loadRoutes()
  console.error('Unhandled error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.redirect('/error/500');
});



module.exports = app;
