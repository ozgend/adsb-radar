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
};
const _airportIcon = L.icon({
  iconUrl: '/public/airport.png',
  iconSize: [14, 14],
  // iconAnchor: [18, 36],
  popupAnchor: [0, 0]
});

// const _aircraftIcon = L.icon({
//   iconUrl: '/public/aircraft.png',
//   iconSize: [24, 24],
//   popupAnchor: [0, 0]
// });

let _airportMarkerLayer;
let _aircraftMarkerLayer;
let _aircraftMarkers = {};

const init = () => {
  console.log('init map');

  // map overlay + layers
  _map = L.map('map', {
    layers: [_mapBaseLayers.Light, _mapBaseLayers.Dark]
  }).setView(_homeLocation, 10);

  // marker layers
  _aircraftMarkerLayer = L.layerGroup().addTo(_map);
  _airportMarkerLayer = L.layerGroup().addTo(_map);

  L.control.layers(_mapBaseLayers, {
    'Airports': _airportMarkerLayer,
    'Aircrafts': _aircraftMarkerLayer
  }).addTo(_map);
  L.control.scale().addTo(_map);

  L.marker(_homeLocation).bindPopup('here').addTo(_map);

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
};

const getAirports = async () => {
  const bounds = _map.getBounds();
  _airportMarkerLayer.clearLayers();

  const airports = await getData(`/airports?start_lat=${bounds._southWest.lat}&start_lng=${bounds._southWest.lng}&end_lat=${bounds._northEast.lat}&end_lng=${bounds._northEast.lng}`) || [];

  airports.forEach(item => {
    L.marker([parseFloat(item.lat), parseFloat(item.lng)], { icon: _airportIcon, title: `${item.name}\n${item.ICAO} - ${item.city},${item.country}` }).addTo(_airportMarkerLayer);
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
    aircrafts.forEach(a => {
      const html = `<div><b>${a.detail.model || '-'}</b><br>${a.callsign} - ${a.detail.registration || a.icao.toString(16)}<br>${a.detail.operator || '-'}<br>${a.altitude}ft. ${parseInt(a.speed)}kt. ${parseInt(a.heading)}°s </div > `;
      const markerIcon = L.divIcon({className:'adsb-radar-aircraft-marker-holder', html: `<img class="adsb-radar-aircraft-icon" style=" transform: rotate(${parseInt(a.heading)}deg)" src="/public/aircraft.png">` });
      if (!_aircraftMarkers[a.icao]) {
        _aircraftMarkers[a.icao] = L.marker([parseFloat(a.lat), parseFloat(a.lng)], { mmmmmmiii: a.icao, dddddeggg: a.heading }).bindPopup(html).addTo(_aircraftMarkerLayer);
      }
      _aircraftMarkers[a.icao].setPopupContent(html);
      _aircraftMarkers[a.icao].setIcon(markerIcon);
      _aircraftMarkers[a.icao].setLatLng([parseFloat(a.lat), parseFloat(a.lng)]);
    });
  };
};

// const getAircrafts = async () => {
//     _aircraftMarkerLayer.clearLayers();

//     const aircrafts = await getData('/aircrafts');

//     aircrafts?.forEach(a => {
//         L.marker([parseFloat(a.lat), parseFloat(a.lng)], {
//             icon: L.divIcon({ className: 'adsb-radar-aircraft-info', html: `< div > <img style="transform: rotate(${a.heading}deg)" src="/public/aircraft.png"><b>${a.detail.model}</b><br>${a.callsign} - ${a.detail.registration}<br>${a.detail.operator}<br>${a.altitude}ft. - ${parseInt(a.speed)}kts</div>` }),
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