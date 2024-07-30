const got = require('got');
const { getSeenAircrafts, persistSeenAircrafts } = require('./service');

const updateSeenAircraft = async () => {
  const seenAircrafts = await getSeenAircrafts();
  if (seenAircrafts.length === 0) {
    return;
  }
  await persistSeenAircrafts(seenAircrafts);

  // const details = icaoResponse.body.map(d => {
  //   return {
  //     _id: d.Icao,
  //     icao_num: parseInt(d.Icao, 16),
  //     icao: d.Icao,
  //     registration: d.Registration,
  //     country: d.Country,
  //     manufacturer: d.Manufacturer,
  //     model: d.Model,
  //     model_icao: d.ModelIcao,
  //     operator: d.Operator,
  //     operator_icao: d.OperatorIcao,
  //     serial: d.Serial,
  //     year: d.YearBuilt
  //   };
  // });
};

const _tasks = [
  { handler: updateSeenAircraft, interval: 2000 }
];

let _pids = [];

const start = async () => {
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