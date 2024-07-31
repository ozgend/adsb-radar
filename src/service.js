'use strict'

const AIRCRAFT_DETAIL_CACHE_TTL = 60 * 60 * 24; // 24 hours
const AIRPORT_SEARCH_CACHE_TTL = 60 * 60 * 24; // 24 hours
const AIRPORT_METAR_CACHE_TTL = 60 * 2; // 2 minutes
const AIRPORT_RUNWAY_CACHE_TTL = 60 * 60 * 24; // 24 hours

const transponderStore = require('./transponder-store');
const cache = require('./cache');
const MongoRepository = require('./mongo-repository');
const { Aircraft, Airport, Runway, SeenAircraft } = require('./models');

const _mongoRepository = new MongoRepository();

const getAircraftIcaoDetail = async (icaoHex) => {
  const cacheKey = `getAircraftIcaoDetail_${icaoHex}`;
  let aircraftDetail = cache.get(cacheKey);

  if (!aircraftDetail) {
    const aircraftCollection = await _mongoRepository.getCollection(Aircraft.SCHEMA);
    aircraftDetail = await aircraftCollection.findOne({ icao24: icaoHex }, { projection: { _id: 0 } });
    cache.set(cacheKey, aircraftDetail, AIRCRAFT_DETAIL_CACHE_TTL);
  }

  return aircraftDetail;
};

const persistSeenAircrafts = async (seenAircrafts) => {
  const collection = await _mongoRepository.getCollection(SeenAircraft.SCHEMA);
  await Promise.all(seenAircrafts.map(async seen => {
    await collection.updateOne({ icao: seen.icao }, { $set: seen }, { upsert: true });
  }));
};

const getSeenAircrafts = async () => {
  const aircrafts = transponderStore.getAircrafts().filter(aircraft => aircraft.lat || aircraft.lon);

  if (aircrafts.length === 0) {
    return [];
  }

  await Promise.all(aircrafts.map(async aircraft => {
    aircraft.detail = await getAircraftIcaoDetail(aircraft.icao.toString(16)) || {};
    aircraft.icao24 = aircraft.icao.toString(16);
    aircraft.latitude = aircraft.lat;
    aircraft.longitude = aircraft.lng;
    delete aircraft.lat;
    delete aircraft.lng;
  }));

  return aircrafts;
};

const updateSeenAircraft = async () => {
  const seenAircrafts = await getSeenAircrafts();
  if (seenAircrafts.length === 0) {
    return;
  }
  await persistSeenAircrafts(seenAircrafts);
};

const getAirportTypes = async () => {
  const cacheKey = 'getAirportTypes';
  let airportTypes = cache.get(cacheKey);

  if (!airportTypes) {
    const airportCollection = await _mongoRepository.getCollection(Airport.SCHEMA);
    airportTypes = await airportCollection.distinct('type');
    cache.set(cacheKey, airportTypes, AIRPORT_SEARCH_CACHE_TTL);
  }

  return airportTypes;
};

const getAirportsInArea = async (startLatitude, startLongitude, endLatitude, endLongitude, types) => {
  const area = [[startLongitude, startLatitude], [endLongitude, endLatitude]];
  const cacheKey = `getAirportsInArea_${JSON.stringify(types)}_${JSON.stringify(area)}`;
  let airports = cache.get(cacheKey);

  if (!airports) {
    const airportCollection = await _mongoRepository.getCollection(Airport.SCHEMA);
    airports = await airportCollection.find({ location: { $geoWithin: { $box: area } }, type: { $in: types } }).toArray();
    cache.set(cacheKey, airports, AIRPORT_SEARCH_CACHE_TTL);
  }

  return airports;
};

const getMetar = async (icao) => {
  const cacheKey = `getMetar_${icao}`;
  let metar = cache.get(cacheKey);

  if (!metar) {
    try {
      const metarResponse = await fetch(`https://sdm.virtualradarserver.co.uk/api/1.00/weather/airport/${icao}?_=${Date.now()}`);
      if (metarResponse.status === 200) {
        const metarData = await metarResponse.json();
        if (metarData && metarData.Airport) {
          metar = {
            source: 'sdm.virtualradarserver.co.uk',
            id: metarData.MetarId,
            icao: metarData.Airport.Icao,
            iata: metarData.Airport.Iata,
            time: metarData.ObservationTimeUtc,
            altitude: metarData.ReportedAltitude || 0,
            temp: metarData.TemperatureCelsius || 0,
            dewpoint: metarData.DewPointCelsius || 0,
            windAngle: metarData.WindDirectionAngle || 0,
            windSpeed: metarData.WindSpeedKnots || 0,
            windGust: metarData.WindGustKnots || 0,
            visibility: metarData.VisibilityStatuteMiles || 0,
            altimeter: metarData.AltimiterInHG || 0,
            precipitation: metarData.PrecipitationInches || 0,
            snow: metarData.SnowInches || 0,
            flight: metarData.FlightCategory
          };
        }
        cache.set(cacheKey, metar, AIRPORT_METAR_CACHE_TTL);
      }
    }
    catch (err) {
      console.error(err);
    }
  }

  return metar || {};
};

const getRunways = async (icao) => {
  const cacheKeyRunways = `getRunways_${icao}`;
  let runways = cache.get(cacheKeyRunways);

  if (!runways) {
    const runwayCollection = await _mongoRepository.getCollection(Runway.SCHEMA);
    runways = await runwayCollection.find({ airportIcao: icao }).toArray();
    cache.set(cacheKeyRunways, runways, AIRPORT_RUNWAY_CACHE_TTL);
  }

  return runways || [];
};

const getAirport = async (icao) => {
  icao = icao.toUpperCase();

  if (icao.includes('-')) {
    return { icao, metar: {}, runways: [] };
  }

  const cacheKeyAirport = `getAirport_${icao}`;

  let airport = cache.get(cacheKeyAirport);

  if (!airport) {
    const airportCollection = await _mongoRepository.getCollection(Airport.SCHEMA);
    airport = await airportCollection.findOne({ icao });
    cache.set(cacheKeyAirport, airport, AIRPORT_SEARCH_CACHE_TTL);
  }

  airport.metar = await getMetar(icao);
  airport.runways = await getRunways(icao);

  return airport;
};

module.exports = { getSeenAircrafts, updateSeenAircraft, getAirportTypes, searchAirports: getAirportsInArea, getAirportDetail: getAirport };