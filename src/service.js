'use strict'

const got = require('got');
const _store = require('./store');
const MongoRepository = require('./mongo-repository');
const { Aircraft, Airport, Runway, SeenAircraft } = require('./models');
const _mongoRepository = new MongoRepository();

exports.searchAirports = async (start_lat, start_long, end_lat, end_long) => {
  const box = [[start_long, start_lat], [end_long, end_lat]];
  const collection = await _mongoRepository.getCollection(Airport.SCHEMA);
  let airports = [];

  // airports = await collection.find({ latitude_deg: { $gte: start_lat, $lte: end_lat }, longitude_deg: { $gte: start_lng, $lte: end_lng } }).toArray();

  airports = await collection.find({ location: { $geoWithin: { $box: box } } }).toArray();

  return airports;
};

exports.getAirportDetail = async (icao) => {
  const airport = { metar: {}, runways: [] };

  if (icao.includes('-')) {
    return airport;
  }

  try {
    const metarResponse = await got(`https://sdm.virtualradarserver.co.uk/api/1.00/weather/airport/${icao}?_=${Date.now()}`, { responseType: 'json' });
    if (metarResponse.statusCode === 200) {
      airport.metar = metarResponse.body || {};
    }
  }
  catch (err) {
    console.error(err);
  }

  const runwayCollection = await _mongoRepository.getCollection(Runway.SCHEMA);
  airport.runways = await runwayCollection.find({ airport_ident: icao }).toArray();

  return airport;
};

exports.getSeenAircrafts = async () => {
  const aircrafts = _store.getAircrafts().filter(aircraft => aircraft.lat || aircraft.lon);
  if (aircrafts.length === 0) {
    return [];
  }

  // integer icao to icao designator

  const icaoList = aircrafts.map(a => a.icao.toString(16));
  const collection = await _mongoRepository.getCollection(Aircraft.SCHEMA);
  const icaoDetails = await collection.find({ icao24: { $in: icaoList } }).toArray();
  aircrafts.forEach(a => { a.detail = icaoDetails.find(d => d.icao24 === a.icao.toString(16)) || {} });
  return aircrafts;
}

exports.persistSeenAircrafts = async (seenAircrafts) => {
  const collection = await _mongoRepository.getCollection(SeenAircraft.SCHEMA);
  await Promise.all(seenAircrafts.map(async seen => {
    await collection.updateOne({ icao: seen.icao }, { $set: seen }, { upsert: true });
  }));
}
