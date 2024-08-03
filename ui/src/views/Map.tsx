import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  FeatureGroup,
} from "react-leaflet";
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";
import "tailwindcss/tailwind.css"
import {
  AirportTypes,
  MapLayers,
  StartCoordinates,
  StartZoom,
} from "../constants";
import { LatLngBounds, LayersControlEvent, Map } from "leaflet";
import { fetchAirports, newSocket } from "../service";
import { IAirport, ISeenAircraft } from "../models";
import { AircraftMarker } from "./AircraftMarker";
import { AirportMarker } from "./AirportMarker";

const { BaseLayer, Overlay } = LayersControl;

interface IProps {}

interface IState {
  zoom: number;
  seenAircrafts: { [key: string]: ISeenAircraft };
  airports: IAirport[];
  viewBounds?: LatLngBounds;
  airportTypes: string[];
}

export class MapView extends React.Component<IProps, IState> {
  private _mapRef = React.createRef<Map>();
  private _socket: WebSocket = newSocket();

  constructor(props: IProps) {
    super(props);
    this.state = {
      zoom: StartZoom,
      seenAircrafts: {},
      airports: [],
      viewBounds: undefined,
      airportTypes: [],
    };
  }

  onMapMoveEnd = () => {
    const viewBounds = this._mapRef.current?.getBounds();
    this.setState({ viewBounds });
    this.getAirports(viewBounds);
  };

  onMapReady = () => {
    console.log("map ready");
    setTimeout(() => {
      this._mapRef.current?.on("moveend", () => this.onMapMoveEnd());
      this._mapRef.current?.on("overlayadd", (lce: LayersControlEvent) => {
        this.setState((state) => {
          const airportTypes = [...state.airportTypes, lce.name];
          return { airportTypes };
        });
        // this.fetchAirports(this.state.viewBounds);
      });
      this._mapRef.current?.on("overlayremove", (lce: LayersControlEvent) => {
        this.setState((state) => {
          const airportTypes = state.airportTypes.filter((t) => t !== lce.name);
          return { airportTypes };
        });
        // this.fetchAirports(this.state.viewBounds);
      });
      const viewBounds = this._mapRef.current?.getBounds();
      this.setState({ viewBounds });
      this.getAirports(viewBounds);
    }, 1000);
  };

  getAirports = async (viewBounds?: LatLngBounds) => {
    if (!viewBounds) {
      return;
    }
    const types =
      this.state.airportTypes?.length === 0
        ? AirportTypes
        : this.state.airportTypes;
    const data = await fetchAirports(viewBounds, types);
    if (data) {
      this.setState({ airports: data ?? [] });
    }
  };

  async componentDidMount() {
    this._socket.onopen = () => {
      console.log("ws connected");
      this._socket.send("client_join");
    };

    this._socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      data.forEach((a: ISeenAircraft) => {
        this.setState((state) => {
          const seenAircrafts = { ...state.seenAircrafts };
          seenAircrafts[a.icao24] = a;
          return { seenAircrafts };
        });
      });
    };
  }

  render() {
    return (
      <div className="flex justify-center w-full overflow-hidden">
        <MapContainer
          whenReady={() => this.onMapReady()}
          zoom={this.state.zoom}
          ref={this._mapRef}
          center={StartCoordinates}
          inertia={true}
          zoomControl={false}
          scrollWheelZoom={true}
          closePopupOnClick={false}
          doubleClickZoom={true}
        >
          <LayersControl position="topleft">
            {MapLayers.map((layer, i) => (
              <BaseLayer key={layer.name} name={layer.name} checked={i === 0}>
                <TileLayer
                  url={layer.props.url}
                  attribution={layer.props.attribution}
                  maxZoom={layer.props.maxZoom}
                />
              </BaseLayer>
            ))}

            <Overlay name="Aircrafts" checked key={"aircrafts"}>
              <FeatureGroup>
                {Object.values(this.state.seenAircrafts)
                  .filter((a) => a.latitude && a.longitude)
                  .map((a) => (
                    <AircraftMarker key={a.icao24} aircraft={a} />
                  ))}
              </FeatureGroup>
            </Overlay>

            {AirportTypes.map((type) => (
              <Overlay
                name={type}
                key={type}
                checked={type.includes("airport")}
              >
                <FeatureGroup>
                  {this.state.airports
                    .filter((a) => a.type === type)
                    .map((a) => (
                      <AirportMarker key={a.icao} airport={a} />
                    ))}
                </FeatureGroup>
              </Overlay>
            ))}
          </LayersControl>

          <Marker position={StartCoordinates}>
            <Popup>rtlsdr</Popup>
          </Marker>
        </MapContainer>
      </div>
    );
  }
}
