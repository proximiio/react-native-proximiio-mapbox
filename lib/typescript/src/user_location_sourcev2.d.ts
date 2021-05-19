import React from 'react';
import { StyleProp } from 'react-native';
import { FillLayerStyle, SymbolLayerStyle } from '@react-native-mapbox-gl/maps';
import { ProximiioLocation } from 'react-native-proximiio';
export declare type UserLocationSourceOptions = {
    aboveLayer?: string;
    markerStyle?: StyleProp<SymbolLayerStyle>;
    accuracyStyle?: StyleProp<FillLayerStyle>;
};
interface Props {
    options?: UserLocationSourceOptions;
}
interface State {
    location?: ProximiioLocation;
}
export declare class UserLocationSource extends React.Component<Props, State> {
    state: State;
    componentDidMount(): void;
    componentWillUnmount(): void;
    private onChange;
    private onLocationChanged;
    render(): JSX.Element | null;
}
export {};
