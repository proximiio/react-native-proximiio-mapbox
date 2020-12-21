export type RouteStepSymbol =
  'START' |
  'TURN_AROUND' |
  'HARD_LEFT' |
  'LEFT' |
  'SLIGHT_LEFT' |
  'STRAIGHT' |
  'SLIGHT_RIGHT' |
  'RIGHT' |
  'HARD_RIGHT' |
  'UP_ELEVATOR' |
  'UP_ESCALATOR' |
  'UP_STAIRS' |
  'DOWN_ELEVATOR' |
  'DOWN_ESCALATOR' |
  'DOWN_STAIRS' |
  'FINISH'
;

export interface RouteStepDescriptor {
  instruction: string,
  symbol: RouteStepSymbol
}

export type FeatureCollection = {
  type: 'FeatureCollection',
  features: FeatureType[]
}

export type ProximiioMapboxRoute = {
  distanceMeters: number;
  distanceCustom?: number;
  distanceCustomUnit?: string;
  duration: number;
  destinationTitle: string;
  steps: RouteStepDescriptor[];
  features: FeatureType[];
}

export type ProximiioUnitConversion = {
  stageList: ProximiioUnitConversionStep[];
}

export type ProximiioUnitConversionStep = {
  unitName: string;
  unitConversionToMeters: number;
  minValueInMeters: number | undefined;
  decimalPoints: number | undefined;
}

/**
 * {string} ProximiioRouteConfiguration.startFeatureId
 * {number[]} ProximiioRouteConfiguration.startLatLonLevel
 * {string} ProximiioRouteConfiguration.destinationFeatureId
 * {number[]} ProximiioRouteConfiguration.destinationLatLonLevel
 * {string} ProximiioRouteConfiguration.destinationTitle
 * {string[][]} ProximiioRouteConfiguration.waypointFeatureIdList
 * {ProximiioWayfindingOptions} ProximiioRouteConfiguration.wayfindingOptions
 */
export type ProximiioRouteConfiguration = {
  startFeatureId: String;
  startLatLonLevel: Number[];
  destinationFeatureId: String;
  destinationLatLonLevel: Number[];
  destinationTitle: String | undefined;
  waypointFeatureIdList: String[][];
  wayfindingOptions: ProximiioWayfindingOptions;
}

export type ProximiioWayfindingOptions = {
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

export type ProximiioRouteEvent = {
  eventType: ProximiioRouteUpdateType;
  text: string;
  additionalText?: string;
  data?: ProximiioRouteUpdateData;
  route: ProximiioMapboxRoute;
}

export type ProximiioRouteUpdateType =
   'CALCULATING'
   | 'RECALCULATING'
   | 'DIRECTION_SOON'
   | 'DIRECTION_IMMEDIATE'
   | 'DIRECTION_NEW'
   | 'DIRECTION_UPDATE'
   | 'FINISHED'
   | 'CANCELED'
   | 'ROUTE_NOT_FOUND'
   | 'ROUTE_OSRM_NETWORK_ERROR'
;

export type ProximiioRouteUpdateData = {
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

export type FeatureType = {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point'
      | 'LineString'
      | 'MultiLineString'
      | 'Polygon'
      | 'MultiPolygon';
    coordinates: any[];
  };
  properties: any;
};
