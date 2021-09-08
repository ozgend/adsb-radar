let _map;
const _ws = new WebSocket(`ws://${window.location.host}/ws`,);
const _homeLocation = [40.98, 29.05];
// const _mapOverlays = {
//   Airport: L.layerGroup(),
//   Aircraft: L.layerGroup()
// };
const _mapBaseLayers = {
  Light: L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }),
  Dark: L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }),
  OSM: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }),
  OSMBW: L.tileLayer('https://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }),
  CartoLight: L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }),
  CartoBlack: L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }),

};
const _airportIcon = L.icon({
  iconUrl: '/public/airport.png',
  iconSize: [14, 14],
  popupAnchor: [0, 0]
});

const _heliportIcon = L.icon({
  iconUrl: '/public/heliport.png',
  iconSize: [14, 14],
  popupAnchor: [0, 0]
});

const _closedportIcon = L.icon({
  iconUrl: '/public/closedport.png',
  iconSize: [14, 14],
  popupAnchor: [0, 0]
});

let _airportPopup;
let _aircraftMarkers = {};
let _aircraftMarkerLayer;
let _airportMarkerLayer;
let _heliportMarkerLayer;
let _closedportMarkerLayer;

const init = () => {
  console.log('init map');

  // map overlay + layers
  _map = L.map('map').setView(_homeLocation, 10);

  // control & marker layers
  _mapBaseLayers.CartoBlack.addTo(_map);
  _aircraftMarkerLayer = L.layerGroup().addTo(_map);
  _airportMarkerLayer = L.layerGroup().addTo(_map);
  _heliportMarkerLayer = L.layerGroup().addTo(_map);
  _closedportMarkerLayer = L.layerGroup().addTo(_map);

  L.control.layers(_mapBaseLayers, {
    'Airports': _airportMarkerLayer,
    'Heliports': _heliportMarkerLayer,
    'Closed': _closedportMarkerLayer,
    'Aircrafts': _aircraftMarkerLayer
  }).addTo(_map);
  L.control.scale().addTo(_map);

  L.marker(_homeLocation).bindPopup('rtl-sdr').addTo(_map);

  // map events
  _map.on('zoomend', () => {
    clearLayer();
    getAirports();
  });

  _map.on('moveend', () => {
    clearLayer();
    getAirports();
  });

  getAirports();
  createAircraftStream();
};

const clearLayer = async () => {
  _aircraftMarkers = {};
  _aircraftMarkerLayer.clearLayers();
  _airportMarkerLayer.clearLayers();
  _heliportMarkerLayer.clearLayers();
  _closedportMarkerLayer.clearLayers();
};

const buildAirportInfoCard = async (airport) => {
  const { metar, runways } = await getData(`/airport/detail/${airport.ident}`);

  html = `<div class="airport-info-card">`;
  html += `<h3>${airport.name}</h3>${airport.ident} - ${airport.iata_code} | ${airport.municipality},${airport.iso_country}`;

  if (runways && runways.length > 0) {
    html += `<h4>Runways (${runways.length})</h4>`;
    runways.forEach(r => { html += `‣ ${r.le_ident}/${r.he_ident} - ${r.surface.toLowerCase()}, ${parseFloat(r.length_ft).toFixed(1)}ft <br>`; });
  }
  if (metar && metar.MetarId) {
    html += `<h4>METAR (${metar.ObservationTimeUtc.replace('T', ' ')} UTC)</h4>
            Temp: ${metar.TemperatureCelsius}°C, Vis: ${metar.VisibilityStatuteMiles} mi, Alt:${metar.AltimiterInHG.toFixed(2)} in /hg<br>
            Wind: ${metar.WindDirectionAngle}° @${metar.WindSpeedKnots} kts., Gust: ${metar.WindGustKnots || 'none'}`;
  }

  html += `</div>`;

  _airportPopup = L.popup().setLatLng([airport.latitude_deg, airport.longitude_deg]).setContent(html).openOn(_map);
};

const buildAircraftInfoCard = (aircraft) => {
  const html = `< div ><b>${aircraft.detail.model || '-'}</b><br>${aircraft.callsign} - ${aircraft.detail.registration || aircraft.icao.toString(16)}<br>${aircraft.detail.operator || '-'}<br>${aircraft.altitude}ft. ${parseInt(aircraft.speed)}kt. ${parseInt(aircraft.heading)}° </div > `;
  return html;
};

const getAirports = async () => {
  const bounds = _map.getBounds();
  const airports = await getData(`/airport/search?start_lat=${bounds._southWest.lat}&start_lng=${bounds._southWest.lng}&end_lat=${bounds._northEast.lat}&end_lng=${bounds._northEast.lng}`) || [];

  let airportMarker;

  airports.forEach(airport => {

    if (airport.type === 'closed') {
      airportMarker = L.marker([parseFloat(airport.latitude_deg), parseFloat(airport.longitude_deg)], { icon: _closedportIcon, title: `${airport.name}\n${airport.ident} - ${airport.iata_code} | ${airport.municipality},${airport.iso_country}` }).addTo(_closedportMarkerLayer)
    }
    else if (airport.type === 'heliport') {
      airportMarker = L.marker([parseFloat(airport.latitude_deg), parseFloat(airport.longitude_deg)], { icon: _heliportIcon, title: `${airport.name}\n${airport.ident} - ${airport.iata_code} | ${airport.municipality},${airport.iso_country}` }).addTo(_heliportMarkerLayer);
    }
    else {
      airportMarker = L.marker([parseFloat(airport.latitude_deg), parseFloat(airport.longitude_deg)], { icon: _airportIcon, title: `${airport.name}\n${airport.ident} - ${airport.iata_code} | ${airport.municipality},${airport.iso_country}` }).addTo(_airportMarkerLayer);
    }

    airportMarker.on('click', (e) => {
      buildAirportInfoCard(airport, airportMarker);
    })
  });
};

const createAircraftStream = () => {
  _ws.onopen = e => {
    _ws.send('client_join');
  };

  _ws.onerror = e => {
    console.error('error');
    console.error(e);
  };

  _ws.onmessage = (message) => {
    const aircrafts = JSON.parse(message.data);
    aircrafts.forEach(aircraft => {
      const html = buildAircraftInfoCard(aircraft);
      const markerIcon = L.divIcon({ className: 'adsb-radar-aircraft-marker-holder', html: `<img class="adsb-radar-aircraft-icon" style=" transform: rotate(${parseInt(aircraft.heading)}deg)" src="/public/aircraft.png">` });
      if (!_aircraftMarkers[aircraft.icao]) {
        _aircraftMarkers[aircraft.icao] = L.marker([parseFloat(aircraft.lat), parseFloat(aircraft.lng)], { mmmmmmiii: aircraft.icao, dddddeggg: aircraft.heading }).bindPopup(html).addTo(_aircraftMarkerLayer);
      }
      _aircraftMarkers[aircraft.icao].setPopupContent(html);
      _aircraftMarkers[aircraft.icao].setIcon(markerIcon);
      _aircraftMarkers[aircraft.icao].setLatLng([parseFloat(aircraft.lat), parseFloat(aircraft.lng)]);
    });
  };
};

// const getAircrafts = async () => {
//     _aircraftMarkerLayer.clearLayers();

//     const aircrafts = await getData('/aircrafts');

//     aircrafts?.forEach(a => {
//         L.marker([parseFloat(a.lat), parseFloat(a.lng)], {
//             icon: L.divIcon({className: 'adsb-radar-aircraft-info', html: `< div > <img style="transform: rotate(${a.heading}deg)" src="/public/aircraft.png"><b>${a.detail.model}</b><br>${a.callsign} - ${a.detail.registration}<br>${a.detail.operator}<br>${a.altitude}ft. - ${parseInt(a.speed)}kts</div>` }),
//         }).addTo(_aircraftMarkerLayer);
//     });
// };

const getData = async (path) => {
  try {
    const response = await axios.get(path);
    return response.status === 200 ? response.data : null;
  }
  catch (err) {
    console.error(err);
    return null;
  }
};

init();