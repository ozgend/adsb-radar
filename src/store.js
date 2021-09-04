'use strict'

const AircraftStore = require('mode-s-aircraft-store');
const store = new AircraftStore({
    timeout: 120000
});

module.exports = store;
