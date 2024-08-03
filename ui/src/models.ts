import { TileLayerProps } from "react-leaflet";

export interface INamedTileLayerProps {
  name: string;
  props: TileLayerProps;
}

export interface IAircraftIcon {
  svg: string;
  size: [number, number];
}

export interface IAirportExternalLink {
  name: string;
  icon: string;
  target: string;
}

export interface ISeenAircraft {
  icao: string;
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  detail: IAircraftDetail;
}

export interface IAircraftDetail {
  acars: string;
  adsb: string;
  modes: string;
  built: string;
  engines: string;
  icaoAircraftType: string;
  manufacturerIcao: string;
  manufacturerName: string;
  model: string;
  typeCode: string;
  operator: string;
  operatorCallsign: string;
  operatorIcao: string;
  owner: string;
  registration: string;
  seatConfiguration: string;
  icaoType: IIcaoAircraftType;
}

export interface IIcaoAircraftType{
  mode: string;
  code: string;
  designator: string;
  engineCount: string;
  engineType: string;
  manufacturer: string;
  name: string;
  wtc: string;
}

export interface IAirport {
  icao: string;
  iata: string;
  gps: string;
  name: string;
  type: string;
  scheduled: boolean;
  latitude: number;
  longitude: number;
  elevation: number;
  country: string;
  municipality: string;
  url?: string;
  wiki?: string;
}

export interface IAirportDetail {
  runways: IRunway[];
  metar: IMetar;
}

export interface IRunway {
  ident: string;
  length: number;
  width: number;
  surface: string;
  lowHeading: number;
  highHeading: number;
  lowIdent: string;
  highIdent: string;
}

export interface IMetar {
  time: string;
  altitude: number;
  temp: number;
  dewpoint: number;
  windDirection: number;
  windSpeed: number;
  windGust: number;
  visibility: number;
  altimeter: number;
  precipitation: number;
  snow: number;
  flight: string;
}