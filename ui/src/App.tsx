import "./App.css";
import React from "react";
import { MapView } from "./views/Map";

interface IProps {}

export default class App extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  render(): React.ReactNode {
    return <MapView />;
  }
}
