const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/lib/sync');
const MongoRepository = require('./mongo-repository');
const _mongoRepository = new MongoRepository();
const { Aircraft, AircraftType, Airport, Runway } = require('../src/models');

const _sources = {
  aircrafts: {
    file: 'aircrafts.csv',
    schema: Aircraft.SCHEMA,
    url: Aircraft.SOURCE,
    method: 'GET',
  },
  aircraftTypes: {
    file: 'aircraft-types.csv',
    schema: AircraftType.SCHEMA,
    url: AircraftType.SOURCE,
    method: 'GET',
  },
  airports: {
    file: 'airports.csv',
    schema: Airport.SCHEMA,
    url: Airport.SOURCE,
    method: 'GET',
  },
  runways: {
    file: 'runways.csv',
    schema: Runway.SCHEMA,
    url: Runway.SOURCE,
    method: 'GET',
  },
};

const clearFs = async () => {
  console.info('clearing csv data');
  fs.rmSync(path.join(__dirname, '../data'), { recursive: true });
  fs.mkdirSync(path.join(__dirname, '../data'));
  console.info('csv data cleared');
};

const fetchData = async (sourceKey) => {
  console.info(`fetching ${sourceKey}`);
  const response = await fetch(_sources[sourceKey].url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceKey}`);
  }
  const data = await response.text();
  fs.writeFileSync(path.join(__dirname, '../data', _sources[sourceKey].file), data);
  console.info(`${sourceKey} fetched`);
};

const populateAirports = async () => {
  console.info('populating airports');
  const raw = fs.readFileSync(path.join(__dirname, '../data', `airports.csv`), { encoding: 'utf8' });
  const data = csvParse(raw, { columns: Airport.FIELDS, skip_empty_lines: true, from_line: 2, }).map(Airport.enrich);
  const collection = await _mongoRepository.getCollection(Airport.SCHEMA);
  await collection.insertMany(data);
  console.info('airports populated');
};

const populateRunways = async () => {
  console.info('populating runways');
  const raw = fs.readFileSync(path.join(__dirname, '../data', `runways.csv`), { encoding: 'utf8' });
  const data = csvParse(raw, { columns: Runway.FIELDS, skip_empty_lines: true, from_line: 2 }).map(Runway.enrich);
  const collection = await _mongoRepository.getCollection(Runway.SCHEMA);
  await collection.insertMany(data);
  console.info('runways populated');
};

const populateAircrafts = async () => {
  console.info('populating aircrafts');
  const raw = fs.readFileSync(path.join(__dirname, '../data', 'aircrafts.csv'), { encoding: 'utf8' });
  const data = csvParse(raw, { columns: Aircraft.FIELDS, skip_empty_lines: true, from_line: 2 }).map(Aircraft.enrich);
  const collection = await _mongoRepository.getCollection(Aircraft.SCHEMA);
  await collection.insertMany(data);
  console.info('aircrafts populated');
};

const populateAircraftTypes = async () => {
  console.info('populating aircraftTypes');
  const raw = fs.readFileSync(path.join(__dirname, '../data', 'aircraft-types.csv'), { encoding: 'utf8' });
  const data = csvParse(raw, { columns: AircraftType.FIELDS, skip_empty_lines: true, from_line: 2 }).map(AircraftType.enrich);
  const collection = await _mongoRepository.getCollection(AircraftType.SCHEMA);
  await collection.insertMany(data);
  console.info('aircraftTypes populated');
};

const populateData = async (willClearFs) => {
  if (willClearFs) {
    console.info('clearing fs');
    await clearFs(willClearFs);
    console.info('fs cleared');
    Object.keys(_sources).forEach(async sourceKey => {
      await fetchData(sourceKey);
    });
  }

  console.info('recreating collections');
  await _mongoRepository.recreateCollections();
  console.info('collections recreated');

  console.info('populating data');
  await populateAirports();
  await populateRunways();
  await populateAircraftTypes();
  await populateAircrafts();
  console.info('data populated');
};

module.exports = { populateData };