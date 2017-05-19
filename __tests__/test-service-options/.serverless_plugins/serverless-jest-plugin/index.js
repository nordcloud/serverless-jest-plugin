// Proxy

const path = require('path');
const plugin = path.join(process.env.PLUGIN_TEST_DIR, '../', 'index.js');
module.exports = require(plugin);
