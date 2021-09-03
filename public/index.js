let _map;
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
    iconSize: [24, 24],
    iconAnchor: [0, 0],
    popupAnchor: [0, 0]
});

let _airportMarkerLayer;
let _aircraftMarkerLayer;

// let _airportsData;

const init = () => {
    console.log('init map');

    // map overlay + layers
    _map = L.map('map').setView(_homeLocation, 10);
    L.control.layers(_mapBaseLayers, _mapOverlays).addTo(_map);
    L.control.scale().addTo(_map);
    L.marker(_homeLocation).bindPopup('here').addTo(_map);

    // marker layers
    _airportMarkerLayer = L.layerGroup().addTo(_map);
    _aircraftMarkerLayer = L.layerGroup().addTo(_map);

    // map events
    _map.on('zoomend', () => {
        getAirports();
    });

    _map.on('moveend', () => {
        getAirports();
    });

    // load data
    getAirports();
    setInterval(getAircrafts, 1000);
};

const getAirports = async () => {
    const bounds = _map.getBounds();
    _airportMarkerLayer.clearLayers();

    const airports = await getData(`/airports?start_lat=${bounds._southWest.lat}&start_lng=${bounds._southWest.lng}&end_lat=${bounds._northEast.lat}&end_lng=${bounds._northEast.lng}`) || [];

    airports.forEach(item => {
        L.marker([parseFloat(item.lat), parseFloat(item.lng)], { icon: _airportIcon, title: `${item.name}\n${item.ICAO} - ${item.city},${item.country}` }).addTo(_airportMarkerLayer);
    });
};

const getAircrafts = async () => {
    _aircraftMarkerLayer.clearLayers();

    const aircrafts = await getData('/aircrafts');

    aircrafts?.forEach(a => {
        L.marker([parseFloat(a.lat), parseFloat(a.lng)], {
            icon: L.divIcon({ className: 'vrs-aircraft-info', html: `<div>${a.callsign} - ${a.icao}<br>${a.altitude}ft. @ ${parseInt(a.speed)}kts</div>` })
        }).addTo(_aircraftMarkerLayer);
    });
};

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