# adsb-radar

A realtime radar application for RTLSDR devices that streams rtl1090 mode-s data into the local live aircraft map.

_Inspired by [Virtual Radar Server](https://github.com/vradarserver/vrs) and [AirplaneJS](https://github.com/watson/airplanejs)._

## Requirements

- any usb RTLSDR DVB-T/TV/FM/DAB device with 1090Mhz support
- rtl1090/dump1090
  - `win`: [jetvision/rtl1090](https://rtl1090.com)
  - `linux`: [flightaware/dump1090](https://github.com/flightaware/dump1090)
  - `macos`: [flightaware/dump1090](https://github.com/flightaware/dump1090)
- nodejs + mongodb

## Features

- it's lightweight and portable. and can be run in raspberry-pi.
- uses web-sockets to update and plot aircraft on [leaflet](https://github.com/Leaflet/Leaflet) map.

## Data References

- frames: [opensky-network.org/aircraftTypes](https://opensky-network.org/datasets/metadata/doc8643AircraftTypes.csv)
- aircraft: [opensky-network.org/aircraftDatabase](https://opensky-network.org/datasets/metadata/aircraftDatabase.csv)
- airports: [ourairports-data/airports.csv](https://davidmegginson.github.io/ourairports-data/airports.csv)
- runways: [ourairports-data/runways.csv](https://davidmegginson.github.io/ourairports-data/runways.csv)
- metar: [virtualradarserver.co.uk](https://sdm.virtualradarserver.co.uk/Metar/Lookup)

## Data Initialization

- set environment variables for `MONGODB_HOST`
- run `npm run init-data [-- refresh]` to download csv, transform and import into mongodb
  - if `refresh` is set, it will re-download the csv files and re-import the data into mongodb
  - if `refresh` is not set, it will only import the data from the existing csv files

## Running the app

- start rtl1090 capture/dump to stream mode-s data
  - `win`: run `rtl1090.exe` (with mode-s + sbs1 broadcast, default port is `31001`)
  - `linux`: `dump1090 --net --quiet` (default raw-tcp port is `30002`)
  - `macos`: `dump1090 --net --quiet` (default raw-tcp port is `30002`)
- set environment variables for `MONGODB_HOST` and `MODE_S_RTL_HOST`
- start the app: `npm start`

## todo

- resolve & display aircraft routes
- diplay list of visible aircrafts & cta
