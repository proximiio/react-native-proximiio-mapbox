export declare enum RouteStepSymbol {
    START = "START",
    TURN_AROUND = "TURN_AROUND",
    HARD_LEFT = "HARD_LEFT",
    LEFT = "LEFT",
    SLIGHT_LEFT = "SLIGHT_LEFT",
    STRAIGHT = "STRAIGHT",
    SLIGHT_RIGHT = "SLIGHT_RIGHT",
    RIGHT = "RIGHT",
    HARD_RIGHT = "HARD_RIGHT",
    UP_ELEVATOR = "UP_ELEVATOR",
    UP_ESCALATOR = "UP_ESCALATOR",
    UP_STAIRS = "UP_STAIRS",
    DOWN_ELEVATOR = "DOWN_ELEVATOR",
    DOWN_ESCALATOR = "DOWN_ESCALATOR",
    DOWN_STAIRS = "DOWN_STAIRS",
    FINISH = "FINISH"
}
export interface RouteStepDescriptor {
    instruction: string;
    symbol: RouteStepSymbol;
}
export declare type FeatureCollection = {
    type: 'FeatureCollection';
    features: ProximiioFeatureType[];
};
export declare type ProximiioMapboxRoute = {
    distanceMeters: number;
    distanceCustom?: number;
    distanceCustomUnit?: string;
    duration: number;
    destinationTitle: string;
    steps: RouteStepDescriptor[];
    features: ProximiioFeatureType[];
};
export declare type ProximiioUnitConversion = {
    stageList: ProximiioUnitConversionStep[];
};
export declare type ProximiioUnitConversionStep = {
    unitName: string;
    unitConversionToMeters: number;
    minValueInMeters: number | undefined;
    decimalPoints: number | undefined;
};
/**
 * {string} ProximiioRouteConfiguration.startFeatureId
 * {number[]} ProximiioRouteConfiguration.startLatLonLevel
 * {string} ProximiioRouteConfiguration.destinationFeatureId
 * {number[]} ProximiioRouteConfiguration.destinationLatLonLevel
 * {string} ProximiioRouteConfiguration.destinationTitle
 * {string[][]} ProximiioRouteConfiguration.waypointFeatureIdList
 * {ProximiioWayfindingOptions} ProximiioRouteConfiguration.wayfindingOptions
 */
export declare type ProximiioRouteConfiguration = {
    startFeatureId: String;
    startLatLonLevel: Number[];
    destinationFeatureId: String;
    destinationLatLonLevel: Number[];
    destinationTitle: String | undefined;
    waypointFeatureIdList: String[][];
    wayfindingOptions: ProximiioWayfindingOptions;
};
export declare type ProximiioWayfindingOptions = {
    avoidBarriers: boolean;
    avoidElevators: boolean;
    avoidEscalators: boolean;
    avoidNarrowPaths: boolean;
    avoidRamps: boolean;
    avoidRevolvingDoors: boolean;
    avoidStaircases: boolean;
    avoidTicketGates: boolean;
    pathFixDistance: boolean;
};
export declare type ProximiioRouteEvent = {
    eventType: ProximiioRouteUpdateType;
    text: string;
    additionalText?: string;
    data?: ProximiioRouteUpdateData;
    route: ProximiioMapboxRoute;
};
export declare enum ProximiioRouteUpdateType {
    CALCULATING = "CALCULATING",
    RECALCULATING = "RECALCULATING",
    DIRECTION_SOON = "DIRECTION_SOON",
    DIRECTION_IMMEDIATE = "DIRECTION_IMMEDIATE",
    DIRECTION_NEW = "DIRECTION_NEW",
    DIRECTION_UPDATE = "DIRECTION_UPDATE",
    FINISHED = "FINISHED",
    CANCELED = "CANCELED",
    ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
    ROUTE_OSRM_NETWORK_ERROR = "ROUTE_OSRM_NETWORK_ERROR"
}
export declare type ProximiioRouteUpdateData = {
    nodeIndex: number;
    stepBearing: number;
    stepDirection: RouteStepSymbol;
    stepDistance: number;
    nextStepBearing: number | undefined;
    nextStepDistance: number | undefined;
    nextStepDirection: RouteStepSymbol | undefined;
    pathLengthRemaining: number | undefined;
    position: [number, number];
};
export declare enum ProximiioGeometryType {
    Point = 0,
    LineString = 1,
    MultiLineString = 2,
    Polygon = 3,
    MultiPolygon = 4
}
export declare type ProximiioFeatureType = {
    id: string;
    type: 'Feature';
    geometry: {
        type: ProximiioGeometryType;
        coordinates: any[];
    };
    properties: any;
};
