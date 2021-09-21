import * as React from 'react';
import { CircleLayerStyle, SymbolLayerStyle } from '@react-native-mapbox-gl/maps';
import { ProximiioLocation } from 'react-native-proximiio';
interface Props {
    onAccuracyChanged?: (accuracy: number) => void;
    onHeadingChanged?: (heading: number) => void;
    headingStyle?: SymbolLayerStyle;
    markerOuterRingStyle?: CircleLayerStyle;
    markerMiddleRingStyle?: CircleLayerStyle;
    markerInnerRingStyle?: CircleLayerStyle;
    showHeadingIndicator?: boolean;
    visible?: boolean;
}
interface State {
    heading?: number;
    location?: ProximiioLocation;
}
export declare class UserLocationSource extends React.Component<Props, State> {
    private accuracy;
    state: State;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element | null;
    private onLocationUpdated;
    private onChange;
}
export declare const createIcon: (styles: Styles, showsUserHeadingIndicator?: boolean | undefined) => JSX.Element[];
interface Styles {
    heading: SymbolLayerStyle;
    outerRing: CircleLayerStyle;
    middleRing: CircleLayerStyle;
    innerRing: CircleLayerStyle;
}
export {};
