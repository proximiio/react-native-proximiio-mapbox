import React from 'react';
export declare type URIImages = {
    [id: string]: {
        uri: string;
        scale: number;
    };
};
interface Props {
}
interface State {
    syncKey: string;
    images: URIImages;
}
export declare class AmenitySource extends React.Component<Props, State> {
    private amenitiesSub?;
    state: {
        syncKey: string;
        images: URIImages;
    };
    constructor(props: Props);
    onChange(): Promise<void>;
    componentDidMount(): void;
    componentWillUnmount(): void;
    shouldComponentUpdate(_nextProps: Props, nextState: State): boolean;
    render(): JSX.Element;
}
export {};
