import React from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { Feature } from './feature';
interface Props {
    level: number;
    filter?: (Feature: Feature) => boolean;
    onPress?: (features: Feature[]) => void;
}
declare type VariousLayer = MapboxGL.BackgroundLayer | MapboxGL.LineLayer | MapboxGL.FillLayer | MapboxGL.SymbolLayer | MapboxGL.CircleLayer | MapboxGL.HeatmapLayer | MapboxGL.FillExtrusionLayer;
interface State {
    collection: {
        type: 'FeatureCollection';
        features: Feature[];
    };
    syncKey: number;
}
export declare class GeoJSONSource extends React.Component<Props, State> {
    state: State;
    componentDidMount(): void;
    componentWillUnmount(): void;
    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, _: any): boolean;
    tryFeatures(): Promise<void>;
    getLayers: () => VariousLayer[];
    onChange: () => void;
    render(): JSX.Element;
}
export default GeoJSONSource;
