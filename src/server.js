const PORT = process.env.PORT ?? 3600;

const path = require('path');
const fastify = require('fastify');
const fastifyStatic = require('@fastify/static');
const fastifyWebsocket = require('@fastify/websocket');
const fastifyCors = require('@fastify/cors');
const { getSeenAircrafts, updateSeenAircraft, getAirportTypes, searchAirports, getAirportDetail } = require('./service');
const backgroundWorker = require('./background-worker');
const rtlProcessor = require('./rtl1090');
const _app = fastify();

let _sockets = [];

_app.register(fastifyWebsocket);
_app.register(fastifyStatic, { prefix: '/', root: path.join(__dirname, 'public') });
_app.register(fastifyCors, { origin: '*' });

_app.register(async (app) => {
  app.get('/ws', { websocket: true }, (socket, res) => {
    try {
      socket.on('open', () => {
        console.log('client socket opened');
        socket.send('hi from server');
      });

      socket.on('connect', () => {
        console.log('client socket connected');
      });

      socket.on('message', message => {
        if (message.toString() == 'client_join') {
          _sockets.push(socket);
        }
      });

      socket.on('close', () => {
        console.log('client disconnected');
        // _sockets = _sockets.filter(s => s !== connection.socket);
      });

      socket.on('error', (err) => {
        console.log('client socket error');
        console.error(err);
      });

      socket.on('end', () => {
        console.log('client socket end');
      });
    }
    catch (err) {
      console.log('generic socket error');
      console.error(err);
    }
  })
});

_app.get('/airport/types', async (req, reply) => {
  const data = await getAirportTypes();
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(data);
});

_app.get('/airport/area', async (req, reply) => {
  const data = await searchAirports(parseFloat(req.query.startLatitude), parseFloat(req.query.startLongitude), parseFloat(req.query.endLatitude), parseFloat(req.query.endLongitude), req.query.types.split(','));
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(data);
});

_app.get('/airport/detail/:icao', async (req, reply) => {
  const data = await getAirportDetail(req.params.icao);
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(data);
});

const publishSeenAircrafts = async () => {
  const aircrafts = await getSeenAircrafts();
  if (aircrafts.length > 0) {
    _sockets.forEach(s => s.send(JSON.stringify(aircrafts)));
  }
};

const initializeServer = async (err, address) => {
  if (err) {
    console.error(err.message);
  }

  rtlProcessor.start();

  backgroundWorker.addTask('publishSeenAircrafts', publishSeenAircrafts, 50);
  backgroundWorker.addTask('updateSeenAircraft', updateSeenAircraft, 500);
  backgroundWorker.start().then(_ => { console.log('adsb-radar - background worker started') });

  console.info(`adsb-radar running @ http://localhost:${PORT}`);
};

_app.listen({ port: PORT }, initializeServer);