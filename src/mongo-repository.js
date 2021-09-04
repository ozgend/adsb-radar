const { MongoClient } = require('mongodb');

class MongoRepository {

  constructor() {
    if (MongoRepository._instance) {
      return MongoRepository._instance;
    }
    this._client;
    this._url = process.env['MONGODB_HOST'];
    this.schemaList = {
      aircraft_icao: 'adsb_radar.aircraft_icao',
      airport_icao: 'adsb_radar.airport_icao'
    };

    MongoRepository._instance = this;
    return MongoRepository._instance;
  }

  connect = () => {
    return MongoClient.connect(this._url);
  };

  getClient = async () => {
    try {
      if (this._client != null) {
        return this._client;
      }
      else {
        this._client = await this.connect();
        console.debug(`mongodb connected to ${this._url}`);
        return this._client;
      }
s    } catch (err) {
      console.error(err);
    }
  };

  getDb = async (name) => {
    const client = await this.getClient();
    return client.db(name);
  };

  getCollection = async (schema) => {
    const path = schema.split('.');
    const db = await this.getDb(path[0])
    return db.collection(path[1]);
  };
};

module.exports = MongoRepository;