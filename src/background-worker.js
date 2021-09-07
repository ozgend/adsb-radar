const got = require('got');
const _store = require('./store');
const MongoRepository = require('./mongo-repository');
const _mongoRepository = new MongoRepository();

const aircraftIcaoDetailUpdate = async () => {
  const aircrafts = _store.getAircrafts();
  const icaoList = aircrafts.map(a => a.icao.toString(16));
  const aircraftDetails = await _collection.find({ icao: { $in: icaoList } }).toArray();
  const icaoCachedList = aircraftDetails.map(a => a.icao);

  const icaoMissingList = icaoList.filter(i => !icaoCachedList.includes(i));
  if (icaoMissingList.length === 0) {
    return;
  }

  const icaoResponse = await got.post('https://sdm.virtualradarserver.co.uk/Aircraft/GetAircraftByIcaos', { responseType: 'json', form: { icaos: icaoMissingList.join('-') } });

  if (icaoResponse.statusCode !== 200) {
    return;
  }

  const details = icaoResponse.body.map(d => {
    return {
      _id: d.Icao,
      icao_num: parseInt(d.Icao, 16),
      icao: d.Icao,
      registration: d.Registration,
      country: d.Country,
      manufacturer: d.Manufacturer,
      model: d.Model,
      model_icao: d.ModelIcao,
      operator: d.Operator,
      operator_icao: d.OperatorIcao,
      serial: d.Serial,
      year: d.YearBuilt
    };
  });

  await Promise.all(details.map(async detail => {
    await _collection.updateOne({ _id: detail._id }, { $set: detail }, { upsert: true });
  }));

};

const _tasks = [
  { handler: aircraftIcaoDetailUpdate, interval: 2000 }
];

let _pids = [];

const start = async () => {
  _collection = await _mongoRepository.getCollection(_mongoRepository.schemaList.aircraft_icao);

  _pids = _tasks.map(task => {
    return setInterval(task.handler, task.interval);
  });
};

const stop = () => {
  _pids.forEach(pid => {
    clearInterval(pid);
  });

  _pids = [];
};

module.exports = { start, stop };