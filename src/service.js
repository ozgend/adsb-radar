'use strict'

const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/lib/sync');
const _store = require('./store');
const MongoRepository = require('./mongo-repository');
const _mongoRepository = new MongoRepository();

const _dataHeaders = {
  airports: ['id', 'name', 'city', 'country', 'IATA', 'ICAO', 'lat', 'lng', 'altitude', 'utcOffset', 'DST', 'tz', 'type', 'source'],
  routes: ['airline', 'airlineId', 'source', 'sourceId', 'dest', 'destId', 'codeshare', 'stops', 'equipment']
};

const _mapDataCache = {
  airports: null,
  routes: null
};

exports.searchAirports = (start_lat, start_lng, end_lat, end_lng) => {
  const data = this.getMapData('airports');
  const airports = data.filter(a => a.lat >= start_lat && a.lat <= end_lat && a.lng >= start_lng && a.lng <= end_lng);
  return airports;
};

exports.getMapData = (name, search) => {
  let data = _mapDataCache[name];

  if (data) {
    return data;
  }

  const raw = fs.readFileSync(path.join(__dirname, '../data', `${name}.csv`), { encoding: 'utf8' });
  data = csvParse(raw, { columns: _dataHeaders[name], skip_empty_lines: true });
  _mapDataCache[name] = data;

  return data;
}

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
