let _map;
const _homeLocation = [40.98, 29.05];
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

const _airportIconSmall = L.icon({
  iconUrl: '/public/airport.png',
  iconSize: [13, 13],
  popupAnchor: [0, 0]
});

const _airportIconMedium = L.icon({
  iconUrl: '/public/airport.png',
  iconSize: [16, 16],
  popupAnchor: [0, 0]
});

const _airportIconLarge = L.icon({
  iconUrl: '/public/airport.png',
  iconSize: [19, 19],
  popupAnchor: [0, 0]
});

const _airportGeneric = L.icon({
  iconUrl: '/public/blue_dot.png',
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

const _iconMapping = {
  large_airport: _airportIconLarge,
  medium_airport: _airportIconMedium,
  small_airport: _airportIconSmall,
  heliport: _heliportIcon,
  closed: _closedportIcon,
  generic: _airportGeneric
};

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
  // _map.on('zoomend', () => {
  //   clearLayer();
  //   getAirports();
  // });

  _map.on('moveend', () => {
    clearLayer();
    getAirports();
  });

  getAirports();
  createLiveSocket();
};

const clearLayer = async () => {
  _aircraftMarkers = {};
  _aircraftMarkerLayer.clearLayers();
  _airportMarkerLayer.clearLayers();
  _heliportMarkerLayer.clearLayers();
  _closedportMarkerLayer.clearLayers();
};

const buildAirportInfoCard = async (airport) => {
  const { metar, runways } = await fetchData(`/airport/detail/${airport.icao}`);

  html = `<div class="airport-info-card">`;
  html += `<h3>${airport.name}</h3>`;
  html += `${airport.icao} (${airport.iata || '-'}) | ${airport.municipality},${airport.country}<br>`;
  html += `<sup>${airport.type.replace('_', ' ')}</sup>`;

  if (runways && runways.length > 0) {
    html += `<h4>Runways (${runways.length})</h4>`;
    runways.forEach(r => { html += `‣ ${r.ident} - ${r.surface.toLowerCase()}, ${parseFloat(r.length).toFixed(1)}ft <br>`; });
  }
  if (metar && metar.MetarId) {
    html += `<h4>METAR (${metar.ObservationTimeUtc.replace('T', ' ')} UTC)</h4>
            Temp: ${metar.TemperatureCelsius}°C, Vis: ${metar.VisibilityStatuteMiles} mi, Alt:${metar.AltimiterInHG.toFixed(2)} in /hg<br>
            Wind: ${metar.WindDirectionAngle}° @${metar.WindSpeedKnots} kts., Gust: ${metar.WindGustKnots || 'none'}`;
  }

  html += `</div>`;

  _airportPopup = L.popup().setLatLng([airport.latitude, airport.longitude]).setContent(html).openOn(_map);
};

const buildAircraftInfoCard = (aircraft) => {
  const html = `<div><b>${aircraft.detail.model || 'no-model'}</b><br>${aircraft.callsign || 'no-call'} - ${aircraft.detail.registration || 'no-reg'} - (${aircraft.icao24}/${aircraft.icao}}<br>${aircraft.detail.owner || 'no-owner'}<br>${aircraft.altitude}ft. ${parseInt(aircraft.speed)}kt. ${parseInt(aircraft.heading)}° </div > `;
  return html;
};

const getAirports = async () => {
  const bounds = _map.getBounds();
  const payload = {
    startLatitude: bounds._southWest.lat,
    startLongitude: bounds._southWest.lng,
    endLatitude: bounds._northEast.lat,
    endLongitude: bounds._northEast.lng,
    // types: ["balloonport","closed","heliport","large_airport","medium_airport","seaplane_base","small_airport"]
    types: ['large_airport', 'medium_airport', 'small_airport']
  };

  const airports = await fetchData('/airport/area', payload) || [];

  airports.forEach(airport => {
    let targetLayer;

    if (airport.type === 'closed') {
      targetLayer = _closedportMarkerLayer;
    }
    else if (airport.type === 'heliport') {
      targetLayer = _heliportMarkerLayer;
    }
    else {
      targetLayer = _airportMarkerLayer;
    }

    const icon = _iconMapping[airport.type] || _iconMapping.generic;
    const title = `${airport.name}\n${airport.icao} - ${airport.iata} | ${airport.municipality},${airport.country}`;
    const marker = L.marker([parseFloat(airport.latitude), parseFloat(airport.longitude)], { icon, title }).addTo(targetLayer);

    marker.on('click', (e) => {
      buildAirportInfoCard(airport, marker);
    })
  });
};

const onSocketAircaftMessage = (message) => {
  console.log('onmessage');
  const aircrafts = JSON.parse(message.data);
  aircrafts.forEach(aircraft => {
    const html = buildAircraftInfoCard(aircraft);
    const markerIcon = L.divIcon({ className: 'adsb-radar-aircraft-marker-holder', html: `<img class="adsb-radar-aircraft-icon" style=" transform: rotate(${parseInt(aircraft.heading)}deg)" src="/public/aircraft.png">` });
    if (!_aircraftMarkers[aircraft.icao24]) {
      _aircraftMarkers[aircraft.icao24] = L.marker([parseFloat(aircraft.latitude), parseFloat(aircraft.longitude)], { mmmmmmiii: aircraft.icao24, dddddeggg: aircraft.heading }).bindPopup(html).addTo(_aircraftMarkerLayer);
    }
    _aircraftMarkers[aircraft.icao24].setPopupContent(html);
    _aircraftMarkers[aircraft.icao24].setIcon(markerIcon);
    _aircraftMarkers[aircraft.icao24].setLatLng([parseFloat(aircraft.latitude), parseFloat(aircraft.longitude)]);
  });
};

const createLiveSocket = () => {
  const socket = new WebSocket(`ws://${window.location.host}/ws`);

  socket.addEventListener('open', () => {
    console.log('onopen');
    socket.send('client_join');
  });

  socket.addEventListener('error', (e) => {
    console.log('onerror');
    console.error('error');
    console.error(e);
  });

  socket.addEventListener('message', onSocketAircaftMessage);
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

const fetchData = async (path, data) => {
  try {
    const url = new URL(`http://${window.location.host}${path}`);
    url.search = new URLSearchParams(data).toString();
    const response = await fetch(url);
    return response.status === 200 ? response.json() : null;
  }
  catch (err) {
    console.error(err);
    return null;
  }
};

init();