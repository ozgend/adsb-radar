const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/lib/sync');
const MongoRepository = require('./mongo-repository');
const { Aircraft, AircraftType, Airport, Runway } = require('../src/models');

const _mongoRepository = new MongoRepository();

const _sources = {
  aircrafts: {
    method: 'GET',
    file: 'aircrafts.csv',
    url: Aircraft.SOURCE,
    schema: Aircraft.SCHEMA,
    fields: Aircraft.FIELDS,
    enrich: Aircraft.enrich,
    filter: (a) => a.icao24,
  },
  aircraftTypes: {
    method: 'GET',
    file: 'aircraft-types.csv',
    url: AircraftType.SOURCE,
    schema: AircraftType.SCHEMA,
    fields: AircraftType.FIELDS,
    enrich: AircraftType.enrich,
    filter: (a) => a.designator,
  },
  airports: {
    method: 'GET',
    file: 'airports.csv',
    url: Airport.SOURCE,
    schema: Airport.SCHEMA,
    fields: Airport.FIELDS,
    enrich: Airport.enrich,
  },
  runways: {
    method: 'GET',
    file: 'runways.csv',
    url: Runway.SOURCE,
    schema: Runway.SCHEMA,
    fields: Runway.FIELDS,
    enrich: Runway.enrich,
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

const populateData = async (sourceKey) => {
  console.info(`populating ${sourceKey}`);
  const source = _sources[sourceKey];
  const raw = fs.readFileSync(path.join(__dirname, '../data', source.file), { encoding: 'utf8' });
  let data = csvParse(raw, { columns: source.fields, skip_empty_lines: true, from_line: 2 });
  if (source.filter) {
    data = data.filter(source.filter);
  }
  data = data.map(source.enrich);
  try {
    const collection = await _mongoRepository.getCollection(source.schema);
    await collection.insertMany(data);
  }
  catch (err) {
    console.error(err);
  }

  console.info(`${sourceKey} populated`);
};



// const populateAirports = async () => {
//   console.info('populating airports');
//   const raw = fs.readFileSync(path.join(__dirname, '../data', `airports.csv`), { encoding: 'utf8' });
//   const data = csvParse(raw, { columns: Airport.FIELDS, skip_empty_lines: true, from_line: 2, }).map(Airport.enrich);
//   const collection = await _mongoRepository.getCollection(Airport.SCHEMA);
//   await collection.insertMany(data);
//   console.info('airports populated');
// };

// const populateRunways = async () => {
//   console.info('populating runways');
//   const raw = fs.readFileSync(path.join(__dirname, '../data', `runways.csv`), { encoding: 'utf8' });
//   const data = csvParse(raw, { columns: Runway.FIELDS, skip_empty_lines: true, from_line: 2 }).map(Runway.enrich);
//   const collection = await _mongoRepository.getCollection(Runway.SCHEMA);
//   await collection.insertMany(data);
//   console.info('runways populated');
// };

// const populateAircrafts = async () => {
//   console.info('populating aircrafts');
//   const raw = fs.readFileSync(path.join(__dirname, '../data', 'aircrafts.csv'), { encoding: 'utf8' });
//   const data = csvParse(raw, { columns: Aircraft.FIELDS, skip_empty_lines: true, from_line: 2 }).filter(a => a.icao24).map(Aircraft.enrich);
//   const collection = await _mongoRepository.getCollection(Aircraft.SCHEMA);
//   await collection.insertMany(data);
//   console.info('aircrafts populated');
// };

// const populateAircraftTypes = async () => {
//   console.info('populating aircraftTypes');
//   const raw = fs.readFileSync(path.join(__dirname, '../data', 'aircraft-types.csv'), { encoding: 'utf8' });
//   const data = csvParse(raw, { columns: AircraftType.FIELDS, skip_empty_lines: true, from_line: 2 }).map(AircraftType.enrich);
//   const collection = await _mongoRepository.getCollection(AircraftType.SCHEMA);
//   await collection.insertMany(data);
//   console.info('aircraftTypes populated');
// };

const initializeData = async (willClearFs) => {
  if (willClearFs) {
    console.info('clearing fs');
    await clearFs(willClearFs);
    console.info('fs cleared');
    await Promise.all(Object.keys(_sources).map(async sourceKey => {
      await fetchData(sourceKey);
    }));
  }

  console.info('recreating collections');
  await _mongoRepository.recreateCollections();
  console.info('collections recreated');

  console.info('populating data');
  await Promise.all(Object.keys(_sources).map(async sourceKey => {
    await populateData(sourceKey);
  }));
  console.info('data populated');
};

module.exports = { initializeData };