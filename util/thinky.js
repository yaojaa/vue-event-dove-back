"use strict"

var settings = require("../conf/settings");

// Initialize thinky
var thinky = require('thinky')({
    host: settings.rethinkdbHost,
    port: settings.rethinkdbPort,
    db: settings.rethinkdbDB,
    user:settings.rethinkdbUser,
    password:settings.rethinkdbPasswd
});

// cannot use exports.thinky = thinky;
module.exports = thinky;
