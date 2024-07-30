'use strict'

const got = require('got');
const { Aircraft, Airport, Runway, SeenAircraft } = require('./models');
const _store = require('./store');
const MongoRepository = require('./mongo-repository');
const _cache = require('./cache');

const _mongoRepository = new MongoRepository();

exports.searchAirports = async (start_lat, start_long, end_lat, end_long) => {
  const box = [[start_long, start_lat], [end_long, end_lat]];
  let airports = _cache.get(`searchAirports_${JSON.stringify(box)}`);

  if (!airports) {
    const airportCollection = await _mongoRepository.getCollection(Airport.SCHEMA);
    airports = await airportCollection.find({ location: { $geoWithin: { $box: box } } }).toArray();
    _cache.set(JSON.stringify(box), airports);
  }

  return airports;
};

exports.getAirportDetail = async (icao) => {
  let airport = { metar: {}, runways: [] };

  if (icao.includes('-')) {
    return airport;
  }

  let metar = _cache.get(`getAirportDetail_metar_${icao}`);

  if (!metar) {
    try {
      const metarResponse = await got(`https://sdm.virtualradarserver.co.uk/api/1.00/weather/airport/${icao}?_=${Date.now()}`, { responseType: 'json' });
      if (metarResponse.statusCode === 200) {
        metar = metarResponse.body || {};
        _cache.set(`getAirportDetail_metar_${icao}`, metar);
      }
    }
    catch (err) {
      console.error(err);
    }
  }

  let runways = _cache.get(`getAirportDetail_runways_${icao}`);

  if (!runways) {
    const runwayCollection = await _mongoRepository.getCollection(Runway.SCHEMA);
    runways = await runwayCollection.find({ airport_ident: icao }).toArray();
    _cache.set(`getAirportDetail_runways_${icao}`, runways);
  }

  airport.metar = metar;
  airport.runways = runways;

  return airport;
};

const _getAircraftIcaoDetail = async (icaoHex) => {
  let detail = _cache.get(`getAircraftIcaoDetails_${icaoHex}`);

  if (!detail) {
    const aircraftCollection = await _mongoRepository.getCollection(Aircraft.SCHEMA);
    detail = await aircraftCollection.findOne({ icao24: icaoHex });
    _cache.set(`getAircraftIcaoDetail_${icaoHex}`, detail);
  }

  return detail;
}

exports.getSeenAircrafts = async () => {
  const aircrafts = _store.getAircrafts().filter(aircraft => aircraft.lat || aircraft.lon);
  if (aircrafts.length === 0) {
    return [];
  }

  const icaoList = aircrafts.map(a => a.icao.toString(16));
  const aircraftCollection = await _mongoRepository.getCollection(Aircraft.SCHEMA);
  const icaoDetails = [];

  icaoList.forEach(async icao => {
    const detail = await _getAircraftIcaoDetail(icao);
    icaoDetails.push(detail);
  });

  aircrafts.forEach(a => { a.detail = icaoDetails.find(d => d.icao24 === a.icao.toString(16)) || {} });
  return aircrafts;
}

exports.persistSeenAircrafts = async (seenAircrafts) => {
  const collection = await _mongoRepository.getCollection(SeenAircraft.SCHEMA);
  await Promise.all(seenAircrafts.map(async seen => {
    await collection.updateOne({ icao: seen.icao }, { $set: seen }, { upsert: true });
  }));
}
