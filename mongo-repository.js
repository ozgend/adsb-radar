const { MongoClient } = require('mongodb');

class MongoRepository {

  constructor() {
    if (MongoRepository._instance) {
      return MongoRepository._instance;
    }

    this._client;
    MongoRepository._instance = this;
    return MongoRepository._instance;
  }

  connect = () => {
    return MongoClient.connect('mongodb://localhost:27017');
  };

  getClient = async () => {
    try {
      if (this._client != null) {
        return this._client;
      }
      else {
        console.log(`new db connection`);
        this._client = await this.connect();
        return this._client;
      }
    } catch (err) {
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