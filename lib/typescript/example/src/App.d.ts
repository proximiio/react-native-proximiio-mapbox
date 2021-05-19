import * as React from 'react';
import MapboxGL from "@react-native-mapbox-gl/maps";
interface Props {
}
interface State {
    coordinates: number[];
    mapLoaded: boolean;
    mapLevel: number;
    proximiioReady: boolean;
    message: string;
}
export default class App extends React.Component<Props, State> {
    _map: MapboxGL.MapView | null;
    _camera: MapboxGL.Camera | null;
    state: {
        coordinates: number[];
        mapLoaded: boolean;
        mapLevel: number;
        proximiioReady: boolean;
        message: string;
    };
    componentDidMount(): void;
    componentWillUnmount(): void;
    initProximiio(): Promise<void>;
    onMessage: (message: string) => void;
    render(): JSX.Element;
}
export {};
