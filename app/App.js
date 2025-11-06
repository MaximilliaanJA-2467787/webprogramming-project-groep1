const { databaseRef } = require('./base/database');
const schema = require('./data/schema');
const ExpressApp = require('./base/ExpressApp.js');
const Logger = require('./utils/Logger.js');
const ErrorHandler = require('./web/middleware/ErrorHandler.js');
const FallbackHandler = require('./web/middleware/FallbackHandler.js');
const LocalsHandler = require('./web/middleware/LocalsHandler.js');
const LogHandler = require('./web/middleware/LogHandler.js');
const loadApiRoutes = require('./web/routing/ApiRoutes.js');
const loadGuestRoutes = require('./web/routing/GuestRoutes.js');
const loadUserRoutes = require('./web/routing/UserRoutes.js');
const loadAuthRoutes = require('./web/routing/AuthRoutes.js');
const loadAdminRoutes = require('./web/routing/AdminRoutes.js');
const loadWalletRoutes = require('./web/routing/WalletRoutes.js');
const loadVendorRoutes = require('./web/routing/VendorRoutes.js');

class App extends ExpressApp {
    constructor() {
        super();
    }

    init(app) {
        schema.seed(databaseRef).then(console.log).catch(console.error);

        app.use(LogHandler);
        app.use(LocalsHandler);

        loadVendorRoutes(app);
        loadWalletRoutes(app);
        loadGuestRoutes(app);
        loadUserRoutes(app);
        loadAuthRoutes(app);
        loadApiRoutes(app);
        loadAdminRoutes(app);

        app.use(FallbackHandler);
        app.use(ErrorHandler);
    }
}

module.exports = App;
