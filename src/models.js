class Airport {
  static SOURCE = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
  static FIELDS = ['id', 'ident', 'type', 'name', 'latitude_deg', 'longitude_deg', 'elevation_ft', 'continent', 'iso_country', 'iso_region', 'municipality', 'scheduled_service', 'gps_code', 'iata_code', 'local_code', 'home_link', 'wikipedia_link', 'keywords'];
  static SCHEMA = 'adsb_radar.airport_icao';
  static INDICES = [{ ident: 1 }, { location: '2dsphere' }];

  constructor() {
    this.id = '';
    this.ident = '';
    this.type = '';
    this.name = '';
    this.latitude_deg = '';
    this.longitude_deg = '';
    this.elevation_ft = '';
    this.continent = '';
    this.iso_country = '';
    this.iso_region = '';
    this.municipality = '';
    this.scheduled_service = '';
    this.gps_code = '';
    this.iata_code = '';
    this.local_code = '';
    this.home_link = '';
    this.wikipedia_link = '';
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
    airport._id = airport.id;
    airport.location = {
      type: 'Point',
      coordinates: [parseFloat(airport.longitude_deg), parseFloat(airport.latitude_deg)],
    };
    return airport;
  }
};

class Runway {
  static SOURCE = 'https://davidmegginson.github.io/ourairports-data/runways.csv';
  static FIELDS = ['id', 'airport_ref', 'airport_ident', 'length_ft', 'width_ft', 'surface', 'lighted', 'closed', 'le_ident', 'le_latitude_deg', 'le_longitude_deg', 'le_elevation_ft', 'le_heading_degT', 'le_displaced_threshold_ft', 'he_ident', 'he_latitude_deg', 'he_longitude_deg', 'he_elevation_ft', 'he_heading_degT', 'he_displaced_threshold_ft'];
  static SCHEMA = 'adsb_radar.runway_icao';
  static INDICES = [{ airport_ident: 1 }];

  constructor() {
    this.id = '';
    this.airport_ref = '';
    this.airport_ident = '';
    this.length_ft = '';
    this.width_ft = '';
    this.surface = '';
    this.lighted = '';
    this.closed = '';
    this.le_ident = '';
    this.le_latitude_deg = '';
    this.le_longitude_deg = '';
    this.le_elevation_ft = '';
    this.le_heading_degT = '';
    this.le_displaced_threshold_ft = '';
    this.he_ident = '';
    this.he_latitude_deg = '';
    this.he_longitude_deg = '';
    this.he_elevation_ft = '';
    this.he_heading_degT = '';
    this.he_displaced_threshold_ft = '';
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
    runway.le_location = {
      type: 'Point',
      coordinates: [parseFloat(runway.le_longitude_deg), parseFloat(runway.le_latitude_deg)],
    };
    runway.he_location = {
      type: 'Point',
      coordinates: [parseFloat(runway.he_longitude_deg), parseFloat(runway.he_latitude_deg)],
    };
    return runway;
  }
};

class AircraftType {
  static SOURCE = 'https://opensky-network.org/datasets/metadata/doc8643AircraftTypes.csv';
  static FIELDS = ['mode', 'code', 'designator', 'engine_count', 'engine_type', 'manufacturer', 'name', 'wtc'];
  static SCHEMA = 'adsb_radar.aircraft_type_icao';
  static INDICES = [{ designator: 1 }];

  constructor() {
    this.mode = '';
    this.code = '';
    this.designator = '';
    this.engine_count = '';
    this.engine_type = '';
    this.manufacturer = '';
    this.name = '';
    this.wtc = '';
  }

  static fromCsvRow(row) {
    const aircraft = new Aircraft();
    Aircraft.FIELDS.forEach(header => {
      aircraft[header] = row[header];
    });
    return aircraft;
  }

  static enrich(aircraft) {
    aircraft._id = aircraft.id;
    return aircraft;
  }
};

class Aircraft {
  static SOURCE = 'https://opensky-network.org/datasets/metadata/aircraftDatabase.csv';
  static FIELDS = ['icao24', 'registration', 'manufacturericao', 'manufacturername', 'model', 'typecode', 'serialnumber', 'linenumber', 'icaoaircrafttype', 'operator', 'operatorcallsign', 'operatoricao', 'operatoriata', 'owner', 'testreg', 'registered', 'reguntil', 'status', 'built', 'firstflightdate', 'seatconfiguration', 'engines', 'modes', 'adsb', 'acars', 'notes', 'categoryDescription'
  ]
  static SCHEMA = 'adsb_radar.aircraft_icao';
  static INDICES = [{ icao24: 1 }];

  constructor() {
    this.icao24 = '';
    this.registration = '';
    this.manufacturericao = '';
    this.manufacturername = '';
    this.model = '';
    this.typecode = '';
    this.serialnumber = '';
    this.linenumber = '';
    this.icaoaircrafttype = '';
    this.operator = '';
    this.operatorcallsign = '';
    this.operatoricao = '';
    this.operatoriata = '';
    this.owner = '';
    this.testreg = '';
    this.registered = '';
    this.reguntil = '';
    this.status = '';
    this.built = '';
    this.firstflightdate = '';
    this.seatconfiguration = '';
    this.engines = '';
    this.modes = '';
    this.adsb = '';
    this.acars = '';
    this.notes = '';
    this.categoryDescription = '';
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
  static FIELDS = ['icao_num', 'icao', 'registration', 'country', 'manufacturer', 'model', 'model_icao', 'operator', 'operator_icao', 'serial', 'year'];
  static SCHEMA = 'adsb_radar.seen_aircraft';
  static INDICES = [{ icao: 1 }, { registration: 1 }];

  constructor() {
    this.icao_num = '';
    this.icao = '';
    this.registration = '';
    this.country = '';
    this.manufacturer = '';
    this.model = '';
    this.model_icao = '';
    this.operator = '';
    this.operator_icao = '';
    this.serial = '';
    this.year = '';
  }
}

module.exports = { Aircraft, AircraftType, Airport, Runway, SeenAircraft };
