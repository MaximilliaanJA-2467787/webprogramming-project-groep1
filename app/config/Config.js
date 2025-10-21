const path = require('path');

// Base directories
const ROOT_DIR = path.join(__dirname, '..'); // Project root
const RESOURCES_DIR = path.join(ROOT_DIR, 'resources');
const WEB_DIR = path.join(ROOT_DIR, 'web');

// View directories
const VIEWS_DIR = path.join(RESOURCES_DIR, 'views');
const PAGES_DIR = path.join(VIEWS_DIR, 'pages');
const LAYOUTS_DIR = path.join(VIEWS_DIR, 'layouts');
const PARTIALS_DIR = path.join(VIEWS_DIR, 'partials');

// Other directories
const ROUTES_DIR = path.join(WEB_DIR, 'routing');
const CONTROLLERS_DIR = path.join(WEB_DIR, 'controllers');
const MIDDLEWARE_DIR = path.join(WEB_DIR, 'middleware');
const PUBLIC_DIR = path.join(RESOURCES_DIR, 'public');

// Configuration object
const config = {
    env: 'development',

    // Paths
    paths: {
        routes: ROUTES_DIR,
        resources: RESOURCES_DIR,
        public: PUBLIC_DIR,
        views: VIEWS_DIR,
        pages: PAGES_DIR,
        layouts: LAYOUTS_DIR,
        partials: PARTIALS_DIR,
        controllers: CONTROLLERS_DIR,
        middleware: MIDDLEWARE_DIR,
    },

    // View engine
    view_engine: 'ejs',

    // Server settings
    server: {
        port: process.env.PORT || 8080,
    },
};

module.exports = config;
