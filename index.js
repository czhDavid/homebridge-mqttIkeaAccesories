const Outlet = require('./src/Outlet.js');
const Lightbulb = require('./src/Lightbulb.js');

function exported(homebridge) {
  Outlet(homebridge);
  Lightbulb(homebridge);
}

module.exports = exported;
