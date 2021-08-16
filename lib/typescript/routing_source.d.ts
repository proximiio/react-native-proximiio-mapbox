import React from 'react';
import { Expression, LineLayerStyle, SymbolLayerStyle } from '@react-native-mapbox-gl/maps';
import { FeatureCollection } from './types';
export declare type RouteState = 'preview' | 'started' | 'canceled' | 'off';
interface Props {
    aboveLayerID?: string;
    level: number;
    showSymbols?: boolean;
    startImage?: string;
    targetImage?: string;
    directionImage?: string;
    symbolLayerStyle?: SymbolLayerStyle;
    lineSymbolLayerStyle?: SymbolLayerStyle;
    completedStyle?: LineLayerStyle;
    remainingStyle?: LineLayerStyle;
    dottedLineStyle?: SymbolLayerStyle;
    dotted?: boolean;
}
interface State {
    collection: FeatureCollection;
    completedFilter: Expression;
    remainingFilter: Expression;
    symbolFilter: Expression;
    lineSymbolFilter: Expression;
    dashedFilter: Expression;
    completedIndex: number;
    remainingIndex: number;
    routeState: RouteState;
    syncKey: string;
    startImage: string;
    targetImage: string;
    directionImage: string;
    symbolLayerStyle: SymbolLayerStyle;
    lineSymbolLayerStyle: SymbolLayerStyle;
    completedStyle: LineLayerStyle;
    remainingStyle: LineLayerStyle;
    dottedLineStyle: SymbolLayerStyle;
}
export declare class RoutingSource extends React.Component<Props, State> {
    constructor(props: Props);
    componentDidMount(): void;
    componentDidUpdate(prevProps: Props): void;
    componentWillUnmount(): void;
    private onRouteEvent;
    private setRouteState;
    onReady: () => Promise<void>;
    onRoutePreview: () => Promise<void>;
    onRouteStarted: () => Promise<void>;
    onRouteUpdated: () => void;
    onRouteCanceled: () => Promise<void>;
    update: () => Promise<void>;
    render(): JSX.Element;
}
export {};
