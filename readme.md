# adsb-radar

A realtime radar application for RTLSDR devices that streams rtl1090 mode-s data into a live aircraft map. 

*Inspired by [Virtual Radar Server](https://github.com/vradarserver/vrs) and [AirplaneJS](https://github.com/watson/airplanejs).*

## Requirements
- any RTLSRD DVB-T/TV/FM/DAB device with 1090Mhz support
- any rtl capture and demodulator below
    - `win`: [jetvision/rtl1090](https://rtl1090.com)
    - `linux`: [antirez/dump1090](https://github.com/antirez/dump1090)
    - `osx`: [mxswd/dump1090-mac](https://github.com/mxswd/dump1090-mac)
- docker or nodejs + mongodb

## Features
- it's lightweight and portable. and can be run in raspberry-pi.
- decodes aircraft icao via [VRS SDM](https://sdm.virtualradarserver.co.uk/) and stores in mongodb
- uses web-sockets to update and plot aircraft on [leaflet](https://github.com/Leaflet/Leaflet) map.

## Running
- start rtl1090 capture/dump to stream mode-s data
- set environment variables for `MONGODB_HOST` and `MODE_S_RTL_HOST`
- `$ docker-compose up`