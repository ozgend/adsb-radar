const path = require('path');
const fastify = require('fastify');
const fastifyStatic = require('fastify-static');
const service = require('./service');

const _backgroundWorker = require('./background-worker');
const _rtlProcessor = require('./rtl1090');
const _port = 4600;
const _app = fastify();

let _sockets = [];

_app.register(require('fastify-websocket'))

_app.register(fastifyStatic, {
  prefix: '/public/',
  root: path.join(__dirname, 'public')
});

_app.get('/', (req, reply) => {
  reply.sendFile('index.html');
});

_app.get('/favicon.ico', (req, reply) => {
  reply.sendFile('favicon.ico');
});

_app.get('/airport/search', async (req, reply) => {
  const data = await service.searchAirports(req.query.start_lat, req.query.start_lng, req.query.end_lat, req.query.end_lng);
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(data);
});

_app.get('/airport/detail/:icao', async (req, reply) => {
  const data = await service.getAirportDetail(req.params.icao);
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(data);
});

_app.get('/ws', { websocket: true }, (connection, req) => {
  connection.socket.on('message', message => {
    if (message.toString() == 'client_join') {
      _sockets.push(connection.socket);
    }
  });
})

_app.listen(_port, '0.0.0.0', async (err, address) => {
  if (err) {
    console.error(err.message);
  }
  console.info(`adsb-radar running @ http://localhost:${_port}`);

  _rtlProcessor.start();
  _backgroundWorker.start().then(_ => { console.log('adsb-radar - background worker started') });
});

const publishAircrafts = async () => {
  const aircrafts = await service.getAircrafts();
  _sockets.forEach(s => s.send(JSON.stringify(aircrafts)));
};

setInterval(publishAircrafts, 500);