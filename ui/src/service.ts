import { Icon, LatLngBounds } from "leaflet";
import { IAirport, IAirportDetail, IAirportExternalLink, ISeenAircraft } from "./models";
import { AircraftIconMap, AircraftTypeDescriptionIconMap, AirlineLogoSource, ApiBaseUrl, ApiEndpoints, GenericAirportIconSvg } from "./constants";

export const fetchAirports = async (viewBounds: LatLngBounds, types: string[]): Promise<IAirport[] | null> => {
  const sw = viewBounds?.getSouthWest();
  const ne = viewBounds?.getNorthEast();
  if (!sw || !ne) {
    return null;
  }
  const payload = {
    startLatitude: sw.lat,
    startLongitude: sw.lng,
    endLatitude: ne.lat,
    endLongitude: ne.lng,
    types,
  };
  const data = await fetchData<IAirport[]>(
    ApiEndpoints.AirportInArea,
    payload as never
  );
  return data;
};

export const fetchAirportInfo = async (icao: string): Promise<IAirportDetail | null> => {
  const data = await fetchData<IAirportDetail>(
    ApiEndpoints.AirportInfo + "/" + icao
  );
  return data;
};

const fetchData = async <TResult>(path: string, data?: never): Promise<TResult | null> => {
  try {
    const url = new URL(`${window.location.protocol}//${ApiBaseUrl}${path}`);
    url.search = new URLSearchParams(data).toString();
    const response = await fetch(url);
    return response.status === 200 ? response.json() as TResult : null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const newSocket = (): WebSocket => {
  return new WebSocket(`ws://${ApiBaseUrl}/ws`);
};

export const getOperatorLogoUrl = (aircraft: ISeenAircraft): string => {
  const value = aircraft.detail?.operatorIcao?.trim() || aircraft.callsign?.trim()
  const icao = value.split(/(\d+)/)[0];
  console.log(`icao: ${icao}, callsign: ${aircraft.callsign?.trim()} - final: ${icao}`);
  if (!icao || icao.trim().length === 0) {
    return AirlineLogoSource.Empty;
  }
  return AirlineLogoSource.AirHex.replace("[ICAO]", icao);
};

export const getAircraftIcon = (aircraft: ISeenAircraft): Icon => {
  const typeDescription = aircraft.detail?.icaoAircraftType ?? 'generic';
  const iconMap = AircraftTypeDescriptionIconMap[typeDescription];
  return AircraftIconMap[iconMap] ?? AircraftIconMap.generic;
};

export const getAirportExternalLinks = (airport: IAirport): IAirportExternalLink[] => {
  return [
    {
      name: "Home",
      icon: GenericAirportIconSvg,
      target: airport.url ?? '',
    },
    {
      name: "Wikipedia",
      icon: "https://en.wikipedia.org/favicon.ico",
      target: airport.wiki ?? '',
    },
    {
      name: "FlightAware",
      icon: "https://www.flightaware.com/favicon.ico",
      target: `https://flightaware.com/live/airport/${airport.icao}`,
    },
    {
      name: "LiveATC",
      icon: "https://www.liveatc.net/favicon.ico",
      target: `https://www.liveatc.net/search/?icao=${airport.icao}`,
    },
  ];
};