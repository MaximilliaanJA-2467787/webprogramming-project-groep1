const express = require('express');
const config = require('./config');
const Logger = require('./utils/Logger');

class ExpressApp {
    constructor() {
        this.express = express();
        this.port = config.server.port;
        this.env = config.env;
    }

    listen() {
        return this.express.listen(this.port, () => {
            Logger.success(`Server running on port ${this.port}`);
            Logger.info(`Environment: ${config.env}`);
        });
    }
}

const app = new ExpressApp();

module.exports = app;
