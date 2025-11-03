const ExpressApp = require('./base/ExpressApp.js');
const Logger = require('./utils/Logger.js');
const ErrorHandler = require('./web/middleware/ErrorHandler.js');
const FallbackHandler = require('./web/middleware/FallbackHandler.js');
const LocalsHandler = require('./web/middleware/LocalsHandler.js');
const LogHandler = require('./web/middleware/LogHandler.js');
const loadApiRoutes = require('./web/routing/ApiRoutes.js');
const loadGuestRoutes = require('./web/routing/GuestRoutes.js');
const loadAuthRoutes = require('./web/routing/AuthRoutes.js');
const Pages = require('./web/routing/Pages.js');
const loadAdminRoutes = require('./web/routing/AdminRoutes.js');

class App extends ExpressApp {
    constructor() {
        super();
    }

    init(app) {
        app.use(LogHandler);
        app.use(LocalsHandler);

        loadGuestRoutes(app);
        loadAuthRoutes(app);
        loadApiRoutes(app);
        loadAdminRoutes(app);

        app.use(FallbackHandler);
        app.use(ErrorHandler);
    }
}

module.exports = App;
