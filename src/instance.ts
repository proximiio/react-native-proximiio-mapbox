import { NativeEventEmitter, NativeModules } from 'react-native';
import axios, { AxiosInstance } from 'axios';
import Proximiio, { ProximiioEvents, ProximiioLocation, ProximiioFloor } from 'react-native-proximiio'
import { isIOS } from './helpers';
import { FeatureType } from './types'
import { Feature } from './feature'

const ProximiioMapboxNative = NativeModules.ProximiioMapboxNative;

export type AmenityCategory = {
  id: string;
  name: string;
};

export type Amenity = {
  id: string;
  category_id: string;
  icon: string;
  title: string;
  description: string;
};

export type RouteOptions = {
  avoidBarriers: boolean;
  avoidElevators: boolean;
  avoidEscalators: boolean;
  avoidNarrowPaths: boolean;
  avoidRamps: boolean;
  avoidRevolvingDoors: boolean;
  avoidStaircases: boolean;
  avoidTicketGates: boolean;
};

export enum SyncState {
  INITIAL_WAITING,
  INITIAL_NETWORK_ERROR,
  INITIAL_RUNNING,
  INITIAL_ERROR,
  INITIAL_FINISHED,
  UPDATE_NETWORK_ERROR,
  UPDATE_RUNNING,
  UPDATE_ERROR,
  UPDATE_FINISHED,
}

export enum ProximiioMapboxEvents {
  FAILURE = 'ProximiioMapboxInitialized',
  READY = 'ProximiioMapboxFailed',
  ROUTE_STARTED = 'ProximiioMapboxRouteStarted',
  ROUTE_CANCELED = 'ProximiioMapboxRouteCanceled',
  ROUTE_UPDATED = 'ProximiioMapboxRouteUpdated',
  ON_LANDMARK = 'ProximiioMapboxOnNavigationLandmark',
  ON_HAZARD = 'ProximiioMapboxOnNavigationHazard',
  ON_SEGMENT = 'ProximiioMapboxOnNavigationSegment',
  ON_DECISION = 'ProximiioMapboxOnNavigationDecision',
  AMENITIES_CHANGED = 'ProximiioMapboxAmenitiesChanged',
  FEATURES_CHANGED = 'ProximiioMapboxFeaturesChanged',
  STYLE_CHANGED = 'ProximiioMapboxStyleChanged',
}

export class ProximiioMapbox {
  token: string = '';
  style?: any;
  axios?: AxiosInstance;
  emitter = new NativeEventEmitter(ProximiioMapboxNative);

  routeOptions: RouteOptions = {
    avoidBarriers: false,
    avoidElevators: false,
    avoidEscalators: false,
    avoidNarrowPaths: false,
    avoidRamps: false,
    avoidRevolvingDoors: false,
    avoidStaircases: false,
    avoidTicketGates: false
  }

  constructor() {
    this.authorize = this.authorize.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  async authorize(token: string) {
    this.token = token;
    await ProximiioMapboxNative.authorize(token);

    Proximiio.subscribe(ProximiioEvents.PositionUpdated, (location: ProximiioLocation) => {
      ProximiioMapboxNative.updateLocation(location.lat, location.lng);
    })

    Proximiio.subscribe(ProximiioEvents.FloorChanged, (floor: ProximiioFloor) => {
      if (isIOS) {
        ProximiioMapboxNative.updateFloor(floor.id);
      } else {
        ProximiioMapboxNative.updateLevel(floor.level);
      }
    })

    this.axios = axios.create({
      baseURL: 'https://api.proximi.fi',
      timeout: 60000,
      headers: {'Authorization': `Bearer ${token}`}
    });
    this.style = (await this.axios.get('/v5/geo/style')).data
  }

  get styleURL() {
    if (this.token === '') {
      throw new Error('ProximiioMapbox is not authorized')
    }

    return `https://api.proximi.fi/v5/geo/style?token=${this.token}`
  }

  isReady(): Promise<boolean> {
    return ProximiioMapboxNative.isReady();
  }

  search(title: string): Promise<Feature[]> {
    return ProximiioMapboxNative.search(title);
  }

  getAmenityCategories(): Promise<AmenityCategory[]> {
    return ProximiioMapboxNative.getAmenityCategories();
  }

  getAmenities(): Promise<Amenity[]> {
    return ProximiioMapboxNative.getAmenities();
  }

  async getFeatures(): Promise<Feature[]> {
    const data = await ProximiioMapboxNative.getFeatures()
    return data.map((f: FeatureType) => new Feature(f))
  }

  getStyle(): Promise<string> {
    return ProximiioMapboxNative.getStyle();
  }

  getSyncStatus(): Promise<number> {
    return ProximiioMapboxNative.getSyncStatus();
  }

  routeFind(
    poi_id: string,
    previewRoute: boolean
  ) {
    ProximiioMapboxNative.routeFind(poi_id, this.routeOptions, previewRoute, !previewRoute);
  }

  // allows you to specify custom destination
  routeFindTo(
    latitude: number,
    longitude: number,
    level: number,
    previewRoute: boolean,
  ) {
    ProximiioMapboxNative.routeFindTo(
      latitude,
      longitude,
      level,
      this.routeOptions,
      previewRoute,
      !previewRoute
    );
  }

  // allows you to specify custom start location
  routeFindFrom(
    latitudeFrom: number,
    longitudeFrom: number,
    levelFrom: number,
    latitudeTo: number,
    longitudeTo: number,
    levelTo: number,
    title: string,
    previewRoute: boolean,
  ) {
    ProximiioMapboxNative.routeFindFrom(
      latitudeFrom,
      longitudeFrom,
      levelFrom,
      latitudeTo,
      longitudeTo,
      levelTo,
      title,
      this.routeOptions,
      previewRoute,
      !previewRoute
    );
  }

  // start the navigation
  routeStart() {
    ProximiioMapboxNative.routeStart();
  }

  // stop navigation, removes the path from map.
  routeCancel() {
    ProximiioMapboxNative.routeCancel();
  }

  // configure unit that should be used for guidance (please make sure you have defined this unit in guidance translations in editor)
  setUnitConversion(unit: string, conversionCoefficient: number) {
    ProximiioMapboxNative.setUnitConversion(unit, conversionCoefficient);
  }

  // set distance before a change in direction when the instruction should be considered 'immediate'
  setStepImmediateThreshold(thresholdInMeters: number) {
    ProximiioMapboxNative.setStepImmediateThreshold(thresholdInMeters);
  }

  // set distance before a change in direction when the instruction should be considered comming 'soon' and possibly warn the user about upcoming event
  setStepPreparationThreshold(thresholdInMeters: number) {
    ProximiioMapboxNative.setStepPreparationThreshold(thresholdInMeters);
  }

  // set a threshold which regulates how far from a destination user must be to be considered he arrived,
  setRouteFinishThreshold(thresholdInMeters: number) {
    ProximiioMapboxNative.setRouteFinishThreshold(thresholdInMeters);
  }

  // enable rerouting if the user strays from path
  setRerouteEnabled(enabled: boolean) {
    ProximiioMapboxNative.setRerouteEnabled(enabled);
  }

  // // configure threshold when the user is considered strayed from path
  setReRouteThreshold(thresholdInMeters: number) {
    ProximiioMapboxNative.setReRouteThreshold(thresholdInMeters);
  }

  setUserLocationToRouteSnappingEnabled(enabled: boolean) {
    ProximiioMapboxNative.setUserLocationToRouteSnappingEnabled(enabled);
  }

  ttsEnable() {
    ProximiioMapboxNative.ttsEnable();
  }

  ttsDisable() {
    ProximiioMapboxNative.ttsDisable();
  }

  ttsHeadingCorrectionEnabled(enabled: boolean) {
    ProximiioMapboxNative.ttsHeadingCorrectionEnabled(enabled);
  }

  ttsReassuranceInstructionEnabled(enabled: boolean) {
    ProximiioMapboxNative.ttsReassuranceInstructionEnabled(enabled);
  }

  ttsRepeatLastInstruction() {
    ProximiioMapboxNative.ttsRepeatLastInstruction();
  }

  ttsHazardAlert(enabled: boolean) {
    ProximiioMapboxNative.ttsHazardAlert(enabled);
  }

  ttsSegmentAlert(emterEnabled: boolean, exitEnabled: boolean) {
    ProximiioMapboxNative.ttsSegmentAlert(emterEnabled, exitEnabled);
  }

  ttsDecisionAlert(enabled: boolean) {
    ProximiioMapboxNative.ttsDecisionAlert(enabled);
  }

  ttsLandmarkAlert(enabled: true) {
    ProximiioMapboxNative.ttsLandmarkAlert(enabled);
  }

  // ttsLevelChangerMetadataKeys(metadataKeys: number[]) {
  //   ProximiioMapboxNative.ttsLevelChangerMetadataKeys(metadataKeys);
  // }

  // ttsDestinationMetadataKeys(metadataKeys: number[]) {
  //   ProximiioMapboxNative.ttsLevelChangerMetadataKeys(metadataKeys);
  // }

  subscribe(event: string, fn: (data: any) => void) {
    return this.emitter.addListener(event, fn);
  }

  unsubscribe(event: string, fn: (data: any) => void) {
    return this.emitter.removeListener(event, fn);
  }
}

export default new ProximiioMapbox()
