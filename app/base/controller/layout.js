const config = require("../../config");
const path = require('path');

function layout(name) {
    return path.join(config.paths.layouts, name);
}

module.exports = layout;
