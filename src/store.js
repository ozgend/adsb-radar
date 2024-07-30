'use strict'
const AircraftStore = require('mode-s-aircraft-store');

const store = new AircraftStore({ timeout: 600000 });

module.exports = store;
