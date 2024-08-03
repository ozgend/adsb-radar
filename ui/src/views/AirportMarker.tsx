import React from "react";
import { Marker, Popup } from "react-leaflet";
import { IAirport, IMetar, IRunway } from "../models";
import { fetchAirportInfo, getAirportExternalLinks } from "../service";
import { AirportIconMap } from "../constants";

interface IProps {
  airport: IAirport;
}

interface IState {
  showPopup: boolean;
  isLoading: boolean;
  metar?: IMetar | null;
  runways?: IRunway[] | null;
}

export class AirportMarker extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      showPopup: false,
      isLoading: false,
    };
  }

  componentWillUnmount() {
    console.log("AirportMarker - unmount");
  }

  onMarkerClick = () => {
    console.log("AirportMarker - onMarkerClick");
    this.setState({ showPopup: !this.state.showPopup });
  };

  onMarkerMouseOver = () => {
    console.log("AirportMarker - onMarkerMouseOver");
  };

  onMarkerMouseOut = () => {
    console.log("AirportMarker - onMarkerMouseOut");
  };

  getAirportInfo = async (icao: string) => {
    this.setState({ isLoading: true });
    const data = await fetchAirportInfo(icao);
    this.setState({
      metar: data?.metar,
      runways: data?.runways,
      isLoading: false,
    });
  };

  getMetarView = () => {
    if (this.state.isLoading) {
      return <span>Metar loading...</span>;
    }
    if (this.state.metar) {
      return (
        <>
          <table className="table-fixed border-separate border-spacing-x-4">
            <thead>
              <tr>
                <th>ALT</th>
                <th>Visib</th>
                <th>Flight</th>
                <th>Temp</th>
                <th>Dew</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{this.state.metar.altimeter}</td>
                <td>{this.state.metar.visibility}m</td>
                <td>{this.state.metar.flight ?? "N/A"}</td>
                <td>{this.state.metar.temp}°C</td>
                <td>{this.state.metar.dewpoint}°C</td>
              </tr>
            </tbody>
          </table>
          <table className="table-fixed border-separate border-spacing-x-4">
            <thead>
              <tr>
                <th>Wind</th>
                <th>Gusts</th>
                <th>Precip.</th>
                <th>Snow</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {this.state.metar.windDirection}° @{" "}
                  {this.state.metar.windSpeed} kts
                </td>
                <td>
                  {this.state.metar.windGust ? this.state.metar.windGust : "0"}{" "}
                  kts
                </td>
                <td>{this.state.metar.precipitation * 25.4} mm</td>
                <td>{this.state.metar.snow * 25.4} mm</td>
              </tr>
            </tbody>
          </table>
        </>
      );
    }
    return <span>Metar not available</span>;
  };

  getRunwaysView = () => {
    if (this.state.isLoading) {
      return <span>Runways loading...</span>;
    }
    if (this.state.runways && this.state.runways.length > 0) {
      return (
        <table className="table-fixed border-separate border-spacing-x-4">
          <thead>
            <tr>
              <th>Ident</th>
              <th>Length</th>
              <th>Width</th>
              <th>Surface</th>
              <th>Heading</th>
            </tr>
          </thead>
          <tbody>
            {this.state.runways.map((r) => (
              <>
                <tr key={r.lowIdent}>
                  <td>{r.lowIdent}</td>
                  <td>{r.length}m</td>
                  <td>{r.width}m</td>
                  <td>{r.surface}</td>
                  <td>{r.lowHeading}°</td>
                </tr>
                <tr key={r.highIdent}>
                  <td>{r.highIdent}</td>
                  <td>{r.length}m</td>
                  <td>{r.width}m</td>
                  <td>{r.surface}</td>
                  <td>{r.highHeading}°</td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      );
    }
    return <span>Runways not available</span>;
  };

  getAirportDescription = (): string => {
    const desc = [];
    if (this.props.airport.icao) {
      desc.push(this.props.airport.icao.trim());
    }
    if (this.props.airport.iata) {
      desc.push(`(${this.props.airport.iata})`.trim());
    }
    if (this.props.airport.type) {
      desc.push(
        `(${this.props.airport.type
          .replace("_", " ")
          .replace("airport", "")
          .trim()})`
      );
    }
    if (this.props.airport.country) {
      desc.push(this.props.airport.country.trim());
    }
    if (this.props.airport.municipality) {
      desc.push(this.props.airport.municipality.trim());
    }
    return desc.filter((d) => d && d.length > 0).join(", ");
  };

  getExternalLinkView = () => {
    const links = getAirportExternalLinks(this.props.airport);
    if (this.props.airport.icao) {
      return (
        <div className="py-1">
          {links &&
            links.map((link) => (
              <button
                key={link.name}
                type="button"
                className="text-white border hover:bg-blue-400 p-1 text-center inline-flex items-center me-2"
                title={link.name}
                onClick={() => window.open(link.target, "_blank")}
              >
                <img className="airport-external-info" src={link.icon} />
              </button>
            ))}
        </div>
      );
    }
    return null;
  };

  render() {
    return (
      <Marker
        eventHandlers={{
          click: () => {
            this.getAirportInfo(this.props.airport.icao);
          },
        }}
        key={this.props.airport.icao}
        icon={AirportIconMap[this.props.airport.type]}
        position={[this.props.airport.latitude, this.props.airport.longitude]}
        title={this.props.airport.icao}
      >
        <Popup>
          <div className="airport-popup">
            <h3 className="text-lg">{this.props.airport.name}</h3>
            <div>
              <span>{this.getAirportDescription()}</span>
              {this.getExternalLinkView()}
            </div>
            <div>
              <h4 className="text-lg mt-4"> Runways</h4>
              {this.getRunwaysView()}
            </div>
            <div>
              <h4 className="text-lg mt-4">Metar</h4>
              {this.getMetarView()}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }
}
