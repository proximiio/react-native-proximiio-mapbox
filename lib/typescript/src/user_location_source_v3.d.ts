import * as React from 'react';
import { ProximiioLocation } from 'react-native-proximiio';
interface Props {
    onAccuracyChanged: (accuracy: number) => void;
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
export declare const createIcon: (showsUserHeadingIndicator?: boolean | undefined, heading?: number | undefined) => (never[] | JSX.Element)[];
export {};
