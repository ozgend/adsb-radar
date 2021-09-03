const Decoder = require('mode-s-decoder');
const net = require('net');
const _store = require('./store');

const _decoder = new Decoder();
const _socket = new net.Socket();

const array_chunks = (array, chunk_size) => Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));

let _options = { retryCount: 1, connectionRetryHandler: -1, isConnected: false };

const processData = async (data) => {
  const rows = data.toString().split('\n').map(row => row.replace(/[\*;\r]/g, '')).filter(row => row);
  const messages = rows.map(row => _decoder.parse(Buffer.from(row, 'hex')));
  messages.forEach(m => _store.addMessage(m));
};

const createConnection = () => {
  if (!_options.isConnected) {
    if (_options.retryInterval) {
      if (_options.maxRetries < _options.retryCount) {
        console.warn(`rtl - max attempts [${_options.maxRetries}] reached. will not connect.`);
        clearInterval(_options.connectionRetryHandler);
      }
      else {
        console.info(`rtl - trying to connect [${_options.host}:${_options.port}]... ${_options.retryCount}/${_options.maxRetries}`);
      }

      _options.retryCount++;
    }

    try {
      _socket.con
      _socket.connect(_options.port, _options.host);
    }
    catch (err) {
      console.error(`rtl - can not connect @ [${_options.host}:${_options.port}]`);
      console.error(err.toString());
    }
  }
};

const startConnectionPoller = () => {
  if (_options.mock) {
    console.info(`rtl - initializing mock data`);

    const fs = require('fs');
    const raw = fs.readFileSync('./data/sample-feed.txt', { encoding: 'utf8' }).split('\n');
    const chunks = array_chunks(raw, 10);

    console.info(`rtl - mock payload size [${raw.length}]`);

    chunks.forEach((chunk, x) => {
      setTimeout(() => {
        console.info(`rtl - mock process [${x + 1}]/[${chunks.length}]`);
        processData(chunk.join('\n'));
      }, (x + 1) * 1000);
    });

    return;
  }

  console.info(`rtl - initializing connection [${_options.host}:${_options.port}]...`);
  if (_options.retryInterval > 0) {
    _options.connectionRetryHandler = setInterval(createConnection, _options.retryInterval);
  }
  else {
    createConnection();
  }
};

_socket.on('connect', () => {
  console.info(`rtl - connection successful @ [${_options.host}:${_options.port}]`);

  _options.isConnected = true;
  if (_options.connectionRetryHandler > 0) {
    clearInterval(_options.connectionRetryHandler);
  }
});

_socket.on('error', err => {
  console.error(`rtl - connection err: [${err.message}]`);
});

_socket.on('data', processData);

_socket.on('close', () => {
  console.warn('rtl - connection closed');
  _options.isConnected = false;

  if (_options.reconnect && _options.connectionRetryHandler < 0) {
    startConnectionPoller();
  }
});

_socket.on('end', () => {
  console.warn('rtl - connection ended');
});

exports.start = (options) => {
  _options = Object.assign(options || {}, _options);
  startConnectionPoller();
};

exports.stop = function () {
  _socket.destroy();
};