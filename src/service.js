'use strict'

const fs = require('fs');
const path = require('path');
const got = require('got');
const csvParse = require('csv-parse/lib/sync');
const _store = require('./store');
const MongoRepository = require('./mongo-repository');
const _mongoRepository = new MongoRepository();

const _dataHeaders = {
  airports: ['id', 'ident', 'type', 'name', 'latitude_deg', 'longitude_deg', 'elevation_ft', 'continent', 'iso_country', 'iso_region', 'municipality', 'scheduled_service', 'gps_code', 'iata_code', 'local_code', 'home_link', 'wikipedia_link', 'keywords'],
  runways: ['id', 'airport_ref', 'airport_ident', 'length_ft', 'width_ft', 'surface', 'lighted', 'closed', 'le_ident', 'le_latitude_deg', 'le_longitude_deg', 'le_elevation_ft', 'le_heading_degT', 'le_displaced_threshold_ft', 'he_ident', 'he_latitude_deg', 'he_longitude_deg', 'he_elevation_ft', 'he_heading_degT', 'he_displaced_threshold_ft']
};

exports.searchAirports = async (start_lat, start_lng, end_lat, end_lng) => {
  const collection = await _mongoRepository.getCollection(_mongoRepository.schemaList.airport_icao);
  let airports = [];

  airports = await collection.find({ latitude_deg: { $gte: start_lat, $lte: end_lat }, longitude_deg: { $gte: start_lng, $lte: end_lng } }).toArray();

  if (airports.length > 0) {
    return airports;
  }

  const raw = fs.readFileSync(path.join(__dirname, '../data', `airports.csv`), { encoding: 'utf8' });
  const data = csvParse(raw, { columns: _dataHeaders.airports, skip_empty_lines: true }).map(d => { d._id = d.id; return d; });
  await collection.insertMany(data);

  airports = data.filter(a => a.latitude_deg >= start_lat && a.latitude_deg <= end_lat && a.longitude_deg >= start_lng && a.longitude_deg <= end_lng);
  return airports;
};

exports.getAirportDetail = async (icao) => {
  const detail = {};

  const metarResponse = await got(`https://sdm.virtualradarserver.co.uk/api/1.00/weather/airport/${icao}?_=${Date.now()}`, { responseType: 'json' });
  if (metarResponse.statusCode === 200) {
    detail.metar = metarResponse.body || {};
  }

  const runwayCollection = await _mongoRepository.getCollection(_mongoRepository.schemaList.runway_icao);
  detail.runways = await runwayCollection.find({ airport_ident: icao }).toArray();

  if (detail.runways.length > 0) {
    return detail;
  }

  const raw = fs.readFileSync(path.join(__dirname, '../data', `runways.csv`), { encoding: 'utf8' });
  const data = csvParse(raw, { columns: _dataHeaders.runways, skip_empty_lines: true, fromLine: 1 }).map(d => { d._id = d.id; return d; });
  await runwayCollection.insertMany(data);

  detail.runways = data.filter(r => r.airport_ident === icao);
  return detail;
};

exports.getAircrafts = async () => {
  const aircrafts = _store.getAircrafts().filter(aircraft => aircraft.lat || aircraft.lon);
  if (aircrafts.length === 0) {
    return [];
  }

  const icaoList = aircrafts.map(a => a.icao.toString(16).toUpperCase());
  const collection = await _mongoRepository.getCollection(_mongoRepository.schemaList.aircraft_icao);
  const icaoDetails = await collection.find({ icao: { $in: icaoList } }).toArray();

  aircrafts.forEach(a => { a.detail = icaoDetails.find(d => d.icao_num === a.icao) || {} });
  return aircrafts;
}
