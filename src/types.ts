export type ProximiioMapboxDirection = "None" |
  "Start" |
  "Finish" |
  "Straight" |
  "LeftHard" |
  "LeftNormal" |
  "LeftSlight" |
  "RightHard" |
  "RightNormal" |
  "RightSlight" |
  "TurnAround" |
  "UpElevator" |
  "DownElevator" |
  "UpEscalator" |
  "DownEscalator" |
  "UpStairs" |
  "DownStairs"

export type ProximiioMapboxRouteNode = {
  lineStringFeatureTo: Feature
  bearingFromLastNode: number
  level: number
  distanceFromLastNode: number
  text: string
  coordinates: [number, number]
  direction: ProximiioMapboxDirection
}

export type FeatureCollection = {
  type: 'FeatureCollection',
  features: Feature[]
}

export type ProximiioMapboxRouteAndroid = Feature[]

export type ProximiioMapboxRouteIOS = {
  nodes: ProximiioMapboxRouteNode[]
}

export type ProximiioMapboxRouteUpdate = {
  nextStepBearing: number
  nextStepDirection: ProximiioMapboxDirection
  nextStepDistance: number
  nodeIndex: number
  pathLengthRemaining: number
  position: [number, number]
  stepBearing: number
  stepDirection: ProximiioMapboxDirection
  stepDistance: number
  stepHeading: number
  remaining: Feature[]
}

export type ProximiioMapboxRouteUpdateEvent = {
  type: "string"
  data: ProximiioMapboxRouteUpdate
}

export type Feature = {
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
