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
  lineStringFeatureTo: FeatureType
  bearingFromLastNode: number
  level: number
  distanceFromLastNode: number
  text: string
  coordinates: [number, number]
  direction: ProximiioMapboxDirection
}

export type FeatureCollection = {
  type: 'FeatureCollection',
  features: FeatureType[]
}

export type ProximiioMapboxRouteAndroid = FeatureType[]

export type ProximiioMapboxRouteIOS = {
  linestringList: FeatureType[]
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
  remaining: FeatureType[]
}

export type ProximiioMapboxRouteUpdateEvent = {
  type: "string"
  data: ProximiioMapboxRouteUpdate
}

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
