'use strict'

const AircraftStore = require('mode-s-aircraft-store');

const transponderStore = new AircraftStore({ timeout: 600000 });
console.log('transponder store initialized');

module.exports = transponderStore;
