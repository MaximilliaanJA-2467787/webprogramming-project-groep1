const express = require('express');
const config = require('../config/Config.js');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const Logger = require("../utils/Logger.js");
const uuid = require('uuid');
const Database = require('better-sqlite3');

const SqliteStore = require("better-sqlite3-session-store")(session)
const db = require('./database/index.js')

class ExpressApp {
    constructor() {
        this.express = express();
        this.port = config.server.port;
        this.env = config.env;
    }

    start() {
        Logger.info('Starting Express Application');
        this.express.set('view engine', config.view_engine);
        this.express.set('views', config.paths.views);
        this.express.use(expressLayouts);
        this.express.set('layout', 'layouts/default-layout');
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(express.json());
        this.express.use(express.static(config.paths.public));
        
        // Session configuration
        this.express.use(session({
            genid: () => uuid.v4(),
            store: new SqliteStore({
                client: db.sqlite,
                expired: {
                    clear: true,
                    intervalMs: 24 * 60 * 60 * 1000
                }
            }),
            secret: config.session.secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: config.env === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            }
        }));
        this.server = null;

        this.init(this.express);
        
        this.server = this.express.listen(this.port, () => {
            Logger.info(`Environment: ${config.env}`);
            Logger.success(`Running on http://localhost:${this.port}/`);
        });
    }

}

module.exports = ExpressApp;