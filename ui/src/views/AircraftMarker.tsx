import React from "react";
import { Marker, Popup } from "react-leaflet";
import { getAircraftIcon, getOperatorLogoUrl } from "../service";
import { ISeenAircraft } from "../models";

interface IProps {
  aircraft: ISeenAircraft;
}

interface IState {}

export class AircraftMarker extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  onMarkerClick = () => {
    console.log("AircraftMarker - onMarkerClick");
  };

  onMarkerMouseOver = () => {
    console.log("AircraftMarker - onMarkerMouseOver");
  };

  onMarkerMouseOut = () => {
    console.log("AircraftMarker - onMarkerMouseOut");
  };

  getAircraftDescription = (): string => {
    const desc = [];
    if (this.props.aircraft.detail.registration?.trim().length > 0) {
      desc.push(this.props.aircraft.detail.registration.trim());
    }
    if (this.props.aircraft.callsign?.trim().length > 0) {
      desc.push(" - " + this.props.aircraft.callsign.trim());
    }
    if (this.props.aircraft.icao24.trim().length > 0) {
      desc.push(`/ (${this.props.aircraft.icao24.trim()})`);
    }
    return desc.filter((d) => d.length > 0).join(" ");
  };

  getOperatorDescription = (): string => {
    const desc = [];
    if (this.props.aircraft.detail.operator?.trim().length > 0) {
      desc.push(this.props.aircraft.detail.operator.trim());
    }
    if (this.props.aircraft.detail.operatorIcao?.trim().length > 0) {
      desc.push(`${this.props.aircraft.detail.operatorIcao.trim()}`);
    }
    if (this.props.aircraft.detail.operatorCallsign?.trim().length > 0) {
      desc.push(`${this.props.aircraft.detail.operatorCallsign.trim()}`);
    }

    if (desc.length === 0) {
      return "Unknown operator";
    }

    return desc.filter((d) => d.length > 0).join(", ");
  };

  getMarkerTitle = (): string => {
    const desc = [];
    if (this.props.aircraft.icao24.trim().length > 0) {
      desc.push(this.props.aircraft.icao24.trim());
    }
    if (this.props.aircraft.callsign?.trim().length > 0) {
      desc.push(this.props.aircraft.callsign.trim());
    }
    if (this.props.aircraft.detail?.registration?.trim().length > 0) {
      desc.push(this.props.aircraft.detail.registration.trim());
    }
    if (this.props.aircraft.detail?.icaoType?.designator?.trim().length > 0) {
      desc.push(this.props.aircraft.detail.icaoType.designator.trim());
    }
    return desc.filter((d) => d.length > 0).join(" - ");
  };

  render() {
    return (
      <Marker
        key={this.props.aircraft.icao24}
        position={[this.props.aircraft.latitude, this.props.aircraft.longitude]}
        icon={getAircraftIcon(this.props.aircraft)}
        title={this.getMarkerTitle()}
        rotationAngle={this.props.aircraft.heading}
        rotationOrigin="center center"
      >
        <Popup>
          <div className="aircraft-popup">
            <h3 className="text-lg">{this.getAircraftDescription()}</h3>
            <table className="my-2 table-fixed border-separate border-spacing-x-4">
              <thead>
                <tr>
                  <th>Altitude</th>
                  <th>Speed</th>
                  <th>Heading</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {this.props.aircraft.altitude.toFixed(0)} f<br></br>
                    {(this.props.aircraft.altitude * 0.3048).toFixed(0)} m
                  </td>
                  <td>
                    {this.props.aircraft.speed.toFixed(0)} kts<br></br>
                    {(this.props.aircraft.speed * 1.852).toFixed(0)} km
                  </td>
                  <td>{this.props.aircraft.heading.toFixed(0)}°</td>
                </tr>
              </tbody>
            </table>

            <h4 className="text-lg mt-4">Details</h4>

            <table className="mx-0 px-0 my-2 table-auto border-separate border-spacing-x-4 text-left self-start	">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Brand</th>
                  <th>Icao</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {this.props.aircraft.detail.icaoType?.name ||
                      this.props.aircraft.detail.model ||
                      "-"}
                  </td>
                  <td>
                    {this.props.aircraft.detail.icaoType?.manufacturer ||
                      this.props.aircraft.detail.manufacturerName ||
                      this.props.aircraft.detail.manufacturerIcao ||
                      "-"}
                  </td>
                  <td>
                    {this.props.aircraft.detail.icaoType?.designator || "-"}
                    {" "}
                    ({this.props.aircraft.detail.icaoAircraftType || "-"})
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="px-4">
              <ul
                role="list"
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                <li className="">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="w-8 h-8 operator-icon"
                        src={getOperatorLogoUrl(this.props.aircraft)}
                        alt={this.props.aircraft.detail?.operatorIcao?.trim() || this.props.aircraft.callsign?.trim()}
                      ></img>
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                      <p className="font-medium py-0 my-0">
                        <span className=" text-gray-900">
                          {this.getOperatorDescription()}
                        </span>
                        <br></br>
                        <span className=" text-gray-600">
                          {this.props.aircraft.detail.owner ?? "-"}{" "}
                        </span>
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }
}
