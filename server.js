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

_app.get('/aircrafts', async (req, reply) => {
  const aircrafts = await service.getAircrafts();
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(aircrafts);
});

_app.get('/airports', async (req, reply) => {
  const data = await service.searchAirports(req.query.start_lat, req.query.start_lng, req.query.end_lat, req.query.end_lng);
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

_app.listen(_port, async (err, address) => {
  if (err) {
    console.error(err.message);
  }
  console.info(`node-vrs running @ http://localhost:${_port}`);

  _rtlProcessor.start({ host: '10.0.0.21', port: 31001, retryInterval: 2500, maxRetries: 20 });
  await _backgroundWorker.start();
});

const publishAircrafts = async () => {
  const aircrafts = await service.getAircrafts();
  _sockets.forEach(s => s.send(JSON.stringify(aircrafts)));
};

setInterval(publishAircrafts, 500);