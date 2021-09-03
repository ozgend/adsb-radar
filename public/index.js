let _map;
const _ws = new WebSocket(`ws://${window.location.host}/ws`);
const _homeLocation = [40.98, 29.05];
const _mapOverlays = {};
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
  iconUrl: '/public/icon-airport.png',
  iconSize: [36, 36],
  iconAnchor: [0, 0],
  popupAnchor: [0, 0]
});

const _aircraftIcon = L.icon({
  iconUrl: '/public/blue_dot.svg',
  iconSize: [24, 24],
  iconAnchor: [0, 0],
  popupAnchor: [0, 0]
});

let _airportMarkerLayer;
let _aircraftMarkerLayer;

let _aircraftMarkers = {};

const init = () => {
  console.log('init map');

  // map overlay + layers
  _map = L.map('map').setView(_homeLocation, 10);
  L.control.layers(_mapBaseLayers, _mapOverlays).addTo(_map);
  L.control.scale().addTo(_map);
  L.marker(_homeLocation).bindPopup('here').addTo(_map);

  // marker layers
  _aircraftMarkerLayer = L.layerGroup().addTo(_map);
  _airportMarkerLayer = L.layerGroup().addTo(_map);

  // map events
  _map.on('zoomend', () => {
    getAirports();
  });

  _map.on('moveend', () => {
    getAirports();
  });

  // load data
  getAirports();
  //setInterval(getAircrafts, 1000);
  registerAircraftSocket();
};

const getAirports = async () => {
  const bounds = _map.getBounds();
  _airportMarkerLayer.clearLayers();

  const airports = await getData(`/airports?start_lat=${bounds._southWest.lat}&start_lng=${bounds._southWest.lng}&end_lat=${bounds._northEast.lat}&end_lng=${bounds._northEast.lng}`) || [];

  airports.forEach(item => {
    L.marker([parseFloat(item.lat), parseFloat(item.lng)], { icon: _airportIcon, title: `${item.name}\n${item.ICAO} - ${item.city},${item.country}` }).addTo(_airportMarkerLayer);
  });
};

const registerAircraftSocket = () => {
  _ws.onopen = e => {
    _ws.send('client_join');
  };

  _ws.onerror = e=>{
    console.error('error');
    console.error(e);
  };

  _ws.onmessage = (message) => {
    const aircrafts = JSON.parse(message.data);
    aircrafts.forEach(a => {
      let markerIcon = L.divIcon({ className: 'vrs-aircraft-info', html: `<div><img style="transform: rotate(${a.heading}deg)" src="/public/aircraft.png"><b>${a.detail.model}</b><br>${a.callsign} - ${a.detail.registration}<br>${a.detail.operator}<br>${a.altitude}ft. - ${parseInt(a.speed)}kts</div>` });
      let marker = _aircraftMarkers[a.icao];

      if (!marker) {
        _aircraftMarkers[a.icao] = marker = L.marker([parseFloat(a.lat), parseFloat(a.lng)], {}).addTo(_aircraftMarkerLayer);
      }

      marker.setIcon(markerIcon);
      marker.setLatLng([parseFloat(a.lat), parseFloat(a.lng)]);
    });
  };
};

// const getAircrafts = async () => {
//     _aircraftMarkerLayer.clearLayers();

//     const aircrafts = await getData('/aircrafts');

//     aircrafts?.forEach(a => {
//         L.marker([parseFloat(a.lat), parseFloat(a.lng)], {
//             icon: L.divIcon({ className: 'vrs-aircraft-info', html: `<div><img style="transform: rotate(${a.heading}deg)" src="/public/aircraft.png"><b>${a.detail.model}</b><br>${a.callsign} - ${a.detail.registration}<br>${a.detail.operator}<br>${a.altitude}ft. - ${parseInt(a.speed)}kts</div>` }),
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