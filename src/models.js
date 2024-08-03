class Airport {
  static SOURCE = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
  static FIELDS = ['id', 'icao', 'type', 'name', 'latitude', 'longitude', 'elevation', 'continent', 'country', 'region', 'municipality', 'scheduled', 'gps', 'iata', 'local', 'url', 'wiki', 'keywords'];
  static SCHEMA = 'adsb.airports';
  static INDICES = [{ icao: 1 }, { location: '2dsphere' }];

  constructor() {
    this.id = '';
    this.icao = '';
    this.type = '';
    this.name = '';
    this.latitude = '';
    this.longitude = '';
    this.elevation = '';
    this.continent = '';
    this.country = '';
    this.region = '';
    this.municipality = '';
    this.scheduled = '';
    this.gps = '';
    this.iata = '';
    this.local = '';
    this.url = '';
    this.wiki = '';
    this.keywords = '';
  }

  static fromCsvRow(row) {
    const airport = new Airport();
    Airport.CSV_FIELDS.forEach(header => {
      airport[header] = row[header];
    });
    return Airport.enrich(airport);
  }

  static enrich(airport) {
    airport._id = airport.icao;
    delete airport.id;
    airport.location = {
      type: 'Point',
      coordinates: [parseFloat(airport.longitude), parseFloat(airport.latitude)],
    };
    return airport;
  }
};

class Runway {
  static SOURCE = 'https://davidmegginson.github.io/ourairports-data/runways.csv';
  static FIELDS = ['id', 'airportRef', 'airportIcao', 'length', 'width', 'surface', 'lighted', 'closed', 'lowIdent', 'lowLatitude', 'lowLongitude', 'lowElevation', 'lowHeading', 'lowDisplacedThreshold', 'highIdent', 'highLatitude', 'highLongitude', 'highElevation', 'highHeading', 'highDisplacedThreshold'];
  static SCHEMA = 'adsb.runways';
  static INDICES = [{ airportIcao: 1 }];

  constructor() {
    this.id = '';
    this.airportRef = '';
    this.airportIcao = '';
    this.length = '';
    this.width = '';
    this.surface = '';
    this.lighted = '';
    this.closed = '';
    this.lowIdent = '';
    this.lowLatitude = '';
    this.lowLongitude = '';
    this.lowElevation = '';
    this.lowHeading = '';
    this.lowDisplacedThreshold = '';
    this.highIdent = '';
    this.highLatitude = '';
    this.highLongitude = '';
    this.highElevation = '';
    this.highHeading = '';
    this.highDisplacedThreshold = '';
  }

  static fromCsvRow(row) {
    const runway = new Runway();
    Runway.FIELDS.forEach(header => {
      runway[header] = row[header];
    });
    return Runway.enrich(runway);
  }

  static enrich(runway) {
    runway._id = runway.id;
    delete runway.id;
    runway.ident = `${runway.lowIdent ?? '-'}/${runway.highIdent ?? '-'}`;
    runway.lowLocation = {
      type: 'Point',
      coordinates: [parseFloat(runway.lowLongitude), parseFloat(runway.lowLatitude)],
    };
    runway.highLocation = {
      type: 'Point',
      coordinates: [parseFloat(runway.highLongitude), parseFloat(runway.highLatitude)],
    };
    return runway;
  }
};

class AircraftType {
  static SOURCE = 'https://opensky-network.org/datasets/metadata/doc8643AircraftTypes.csv';
  static FIELDS = ['mode', 'code', 'designator', 'engineCount', 'engineType', 'manufacturer', 'name', 'wtc'];
  static SCHEMA = 'adsb.aircraftTypes';
  static INDICES = [{ designator: 1 }];

  constructor() {
    this.mode = '';
    this.code = '';
    this.designator = '';
    this.engineCount = '';
    this.engineType = '';
    this.manufacturer = '';
    this.name = '';
    this.wtc = '';
  }

  static fromCsvRow(row) {
    const aircraft = new AircraftType();
    AircraftType.FIELDS.forEach(header => {
      aircraft[header] = row[header];
    });
    return aircraft;
  }

  static enrich(aircraft) {
    aircraft.Id = aircraft.id;
    return aircraft;
  }
};

class Aircraft {
  static SOURCE = 'https://opensky-network.org/datasets/metadata/aircraftDatabase.csv';
  static FIELDS = ['icao24', 'registration', 'manufacturerIcao', 'manufacturerName', 'model', 'typeCode', 'serialNumber', 'lineNumber', 'icaoAircraftType', 'operator', 'operatorCallsign', 'operatorIcao', 'operatorIata', 'owner', 'testReg', 'registered', 'regUntil', 'status', 'built', 'firstFlightDate', 'seatConfiguration', 'engines', 'modes', 'adsb', 'acars', 'notes', 'description']
  static SCHEMA = 'adsb.aircrafts';
  static INDICES = [{ icao24: 1 }];

  constructor() {
    this.icao24 = '';
    this.registration = '';
    this.manufacturerIcao = '';
    this.manufacturerName = '';
    this.model = '';
    this.typeCode = '';
    this.serialNumber = '';
    this.lineNumber = '';
    this.icaoAircraftType = '';
    this.operator = '';
    this.operatorCallsign = '';
    this.operatorIcao = '';
    this.operatorIata = '';
    this.owner = '';
    this.testReg = '';
    this.registered = '';
    this.regUntil = '';
    this.status = '';
    this.built = '';
    this.firstFlightDate = '';
    this.seatConfiguration = '';
    this.engines = '';
    this.modes = '';
    this.adsb = '';
    this.acars = '';
    this.notes = '';
    this.description = '';
  }

  static fromCsvRow(row) {
    const aircraft = new Aircraft();
    Aircraft.FIELDS.forEach(header => {
      aircraft[header] = row[header];
    });
    return aircraft;
  }

  static enrich(aircraft) {
    return aircraft;
  }
};

class SeenAircraft {
  static FIELDS = ['icaoNum', 'icao', 'registration', 'country', 'manufacturer', 'model', 'modelIcao', 'operator', 'operatorIcao', 'serial', 'year'];
  static SCHEMA = 'adsb.seenAircraft';
  static INDICES = [{ icao: 1 }, { registration: 1 }];

  constructor() {
    this.icaoNum = '';
    this.icao = '';
    this.registration = '';
    this.country = '';
    this.manufacturer = '';
    this.model = '';
    this.modelIcao = '';
    this.operator = '';
    this.operatorIcao = '';
    this.serial = '';
    this.year = '';
  }
}

module.exports = { Aircraft, AircraftType, Airport, Runway, SeenAircraft };
