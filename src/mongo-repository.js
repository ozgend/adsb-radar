'use strict';
const { MongoClient } = require('mongodb');
const { Aircraft, AircraftType, Airport, Runway, SeenAircraft } = require('./models');

const collections = {};

class MongoRepository {

  constructor() {
    if (MongoRepository._instance) {
      return MongoRepository._instance;
    }
    this._client;
    this._db;
    this._url = process.env['MONGODB_HOST'];
    MongoRepository._instance = this;
    return MongoRepository._instance;
  }

  _connect = async () => {
    return MongoClient.connect(this._url);
  };

  _getClient = async () => {
    try {
      if (!this._client) {
        this._client = await this._connect();
        console.debug(`mongodb connected to ${this._url}`);
      }
      return this._client;
    } catch (err) {
      console.error(err);
    }
  };

  _getDb = async (name) => {
    if (!this._db) {
      this._db = (await this._getClient()).db(name);
    }
    return this._db;
  };

  getCollection = async (schema) => {
    const path = schema.split('.');
    const dbName = path[0];
    const collectionName = path[1];
    const db = await this._getDb(dbName);
    if (!collections[collectionName]) {
      collections[collectionName] = db.collection(collectionName);
    }
    return collections[collectionName];
  };

  recreateCollections = async () => {
    console.debug('dropping collections');

    const db = await this._getDb(Aircraft.SCHEMA.split('.')[0]);
    await db.dropDatabase();

    console.debug('recreating collections');

    await db.createCollection(Airport.SCHEMA.split('.')[1]).then((collection) => {
      Airport.INDICES.forEach(async index => {
        await collection.createIndex(index);
      });
    })

    await db.createCollection(Runway.SCHEMA.split('.')[1]).then((collection) => {
      Runway.INDICES.forEach(async index => {
        await collection.createIndex(index);
      });
    });

    await db.createCollection(Aircraft.SCHEMA.split('.')[1]).then((collection) => {
      Aircraft.INDICES.forEach(async index => {
        await collection.createIndex(index);
      });
    });

    await db.createCollection(AircraftType.SCHEMA.split('.')[1]).then((collection) => {
      AircraftType.INDICES.forEach(async index => {
        await collection.createIndex(index);
      });
    });

    await db.createCollection(SeenAircraft.SCHEMA.split('.')[1]).then((collection) => {
      SeenAircraft.INDICES.forEach(async index => {
        await collection.createIndex(index);
      });
    });
  }
};

module.exports = MongoRepository;