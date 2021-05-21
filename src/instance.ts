import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import Proximiio, { ProximiioEvents, ProximiioLocation, ProximiioFloor } from 'react-native-proximiio'
import { isIOS } from './helpers';
import {ProximiioFeatureType, ProximiioUnitConversion} from './types'
import { Feature } from './feature'
import { ProximiioRouteManager } from './route_managerv2';

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

export enum ProximiioMapboxSyncStatus {
  INITIAL_WAITING = 'INITIAL_WAITING',
  INITIAL_NETWORK_ERROR = 'INITIAL_NETWORK_ERROR',
  INITIAL_RUNNING = 'INITIAL_RUNNING',
  INITIAL_ERROR = 'INITIAL_ERROR',
  INITIAL_FINISHED = 'INITIAL_FINISHED',
  UPDATE_NETWORK_ERROR = 'UPDATE_NETWORK_ERROR',
  UPDATE_RUNNING = 'UPDATE_RUNNING',
  UPDATE_ERROR = 'UPDATE_ERROR',
  UPDATE_FINISHED = 'UPDATE_FINISHED',
}

export enum ProximiioMapboxEvents {
  FAILURE = 'ProximiioMapboxInitialized',
  READY = 'ProximiioMapboxFailed',
  LOCATION_UPDATED = 'ProximiioMapboxLocationUpdate',
  ROUTE = 'ProximiioMapbox.RouteEvent',
  ROUTE_UPDATE = 'ProximiioMapbox.RouteEventUpdate',
  ON_LANDMARK = 'ProximiioMapboxOnNavigationLandmark',
  ON_HAZARD = 'ProximiioMapboxOnNavigationHazard',
  ON_SEGMENT = 'ProximiioMapboxOnNavigationSegment',
  ON_DECISION = 'ProximiioMapboxOnNavigationDecision',
  AMENITIES_CHANGED = 'ProximiioMapboxAmenitiesChanged',
  FEATURES_CHANGED = 'ProximiioMapboxFeaturesChanged',
  STYLE_CHANGED = 'ProximiioMapboxStyleChanged',
  SYNC_STATUS = 'ProximiioMapboxSyncStatusChanged',
}

/**
 * To be used only internally, as amenities and feaures are cached locally due to size.
 */
enum ProximiioMapboxInternalEvents {
  AMENITIES_CHANGED = 'ProximiioMapboxAmenitiesChangedInternal',
  FEATURES_CHANGED = 'ProximiioMapboxFeaturesChangedInternal',
}

export class ProximiioMapbox {
  token: string = '';
  style?: any;
  axios?: AxiosInstance;
  emitter = new NativeEventEmitter(ProximiioMapboxNative);
  route: ProximiioRouteManager = new ProximiioRouteManager();
  amenityCache: Amenity[];
  featureCache: Feature[];
  // isLoadingAmenities = false
  isLoadingFeatures = false

  constructor() {
    this.authorize = this.authorize.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.amenityCache = [];
    this.featureCache = [];
  }

  async authorize(token: string) {
    if (this.token.length > 0) {
      console.log('ProximiioMapbox already authorized, skipping')
      return
    }

    this.token = token;

    Proximiio.subscribe(ProximiioEvents.PositionUpdated, (location: ProximiioLocation) => {
      ProximiioMapboxNative.updateLocation(location.lat, location.lng, location.sourceType, location.accuracy).then((result: ProximiioLocation) => {
        // let location: ProximiioLocation = {
        //   lng: result.lng,
        //   lat: result.lat,
        //   sourceType: result.sourceType,
        //   accuracy: result.accuracy,
        // };
        this.emitter.emit(ProximiioMapboxEvents.LOCATION_UPDATED, result);
      });
    });
    Proximiio.subscribe(ProximiioEvents.FloorChanged, (floor: ProximiioFloor) => {
      if (isIOS) {
        ProximiioMapboxNative.updateFloor(floor.id);
      } else {
        ProximiioMapboxNative.updateLevel(floor.level);
      }
    });

    this.subscribe(ProximiioMapboxEvents.ROUTE, evt => this.route.onCalculated(evt));
    this.subscribe(ProximiioMapboxEvents.ROUTE_UPDATE, evt => this.route.onUpdate(evt));
    this.subscribe(ProximiioMapboxInternalEvents.AMENITIES_CHANGED, this.__amenitiesChanged.bind(this));
    this.subscribe(ProximiioMapboxInternalEvents.FEATURES_CHANGED, this.__featuresChanged.bind(this));


    await ProximiioMapboxNative.authorize(token);

    this.axios = axios.create({
      baseURL: 'https://api.proximi.fi',
      timeout: 60000,
      headers: {'Authorization': `Bearer ${token}`}
    });

    this.style = (await this.axios.get('/v5/geo/style')).data;
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
  __amenitiesChanged(amenities: Amenity[]) {
    this.amenityCache = amenities;
    this.emitter.emit(ProximiioMapboxEvents.AMENITIES_CHANGED);
  }

  async __featuresChanged(features: Feature[]) {
    this.featureCache = features.map((f: Feature) => {
      return new Feature(Platform.OS === 'ios' ? f : JSON.parse(f as unknown as string));
    });
    this.emitter.emit(ProximiioMapboxEvents.FEATURES_CHANGED);
  }

  getAmenities(): Amenity[] {
    return this.amenityCache;
  }

  getFeatures(): Feature[] {
    return this.featureCache;
  }

  // TODO: this flow was replaced due to frequent race conditions
  // async getAmenities(): Promise<Amenity[]> {
  //   if (this.amenityCache.length > 0) {
  //     return this.amenityCache;
  //   }
  //
  //   const local = await AsyncStorage.getItem('proximiio:amenities');
  //
  //   if (local) {
  //     const parsed = JSON.parse(local);
  //     console.log('getAmenities - local | count: ', parsed.length, parsed);
  //     if (parsed.length > 0) {
  //       this.amenityCache = JSON.parse(local) as Amenity[];
  //       console.log('getAmenities - local used: ', this.amenityCache);
  //       return this.amenityCache;
  //     }
  //   }
  //
  //   if (this.isLoadingAmenities) {
  //     console.log('isLoadingAmenities!');
  //     return [] as Amenity[]
  //   }
  //
  //   if (Platform.OS === 'ios') {
  //     await ProximiioMapboxNative.syncAmenities();
  //   }
  //
  //   this.isLoadingAmenities = true;
  //   this.amenityCache = (await ProximiioMapboxNative.getAmenities()) as Amenity[];
  //   await AsyncStorage.setItem('proximiio:amenities', JSON.stringify(this.amenityCache));
  //   this.emitter.emit(ProximiioMapboxEvents.AMENITIES_CHANGED);
  //
  //   console.log('getAmenities | count: ', this.amenityCache.length);
  //   return this.amenityCache;
  // }
  //
  // async getFeatures(): Promise<Feature[]> {
  //   if (this.featureCache.length > 0) {
  //     return this.featureCache
  //   }
  //
  //   const local = await AsyncStorage.getItem('proximiio:features');
  //
  //   if (local) {
  //     const parsed = JSON.parse(local);
  //     if (parsed.length > 0) {
  //       this.featureCache = JSON.parse(local).map((f: any) => new Feature(f));
  //       this.emitter.emit(ProximiioMapboxEvents.FEATURES_CHANGED);
  //       return this.featureCache;
  //     }
  //   }
  //
  //   if (this.isLoadingFeatures) {
  //     return [] as Feature[]
  //   }
  //
  //   this.isLoadingFeatures = true;
  //
  //   if (Platform.OS === 'ios') {
  //     await ProximiioMapboxNative.syncFeatures();
  //   }
  //
  //   const native = (await ProximiioMapboxNative.getFeatures())
  //     .map((f: ProximiioFeatureType) => new Feature(Platform.OS === 'ios' ? f : JSON.parse(f as unknown as string) ))
  //
  //   this.featureCache = native;
  //   await AsyncStorage.setItem('proximiio:features', JSON.stringify(this.featureCache));
  //   this.isLoadingFeatures = false;
  //   if (native.length > 0) {
  //     this.emitter.emit(ProximiioMapboxEvents.FEATURES_CHANGED);
  //   }
  //   return this.featureCache
  // }

  // TODO is this necessary?
  async syncFeatures(): Promise<void> {
    await AsyncStorage.removeItem('proximiio:features');
    this.isLoadingFeatures = true;

    if (Platform.OS === 'ios') {
      await ProximiioMapboxNative.syncFeatures();
    }

    const native = (await ProximiioMapboxNative.getFeatures())
      .map((f: ProximiioFeatureType) => new Feature(Platform.OS === 'ios' ? f : JSON.parse(f as unknown as string) ))

    this.featureCache = native;
    await AsyncStorage.setItem('proximiio:features', JSON.stringify(this.featureCache));
    this.isLoadingFeatures = false;
    if (native.length > 0) {
      this.emitter.emit(ProximiioMapboxEvents.FEATURES_CHANGED);
    }
  }

  getStyle(): Promise<string> {
    return ProximiioMapboxNative.getStyle();
  }

  getSyncStatus(): Promise<number> {
    return ProximiioMapboxNative.getSyncStatus();
  }

  startSyncNow() {
    ProximiioMapboxNative.startSyncNow();
  }

  /**
   * Map int -> int
   */
  setLevelOverrideMap(levelOverrideMap: number) {
    ProximiioMapboxNative.setLevelOverrideMap(levelOverrideMap);
  }

  // configure units that should be used for guidance (please make sure you have defined this unit in guidance translations in editor)
  setUnitConversion(unitConversion: ProximiioUnitConversion) {
    ProximiioMapboxNative.setUnitConversion(JSON.stringify(unitConversion));
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

  setUserLocationToRouteSnappingThreshold(threshold: number) {
    ProximiioMapboxNative.setUserLocationToRouteSnappingThreshold(threshold);
  }

  ttsEnabled(enabled: boolean) {
    if (enabled) {
      ProximiioMapboxNative.ttsEnable();
    } else {
      ProximiioMapboxNative.ttsDisable();
    }
  }

  /**
   * Enables TTS user warnings about:
   * - starting orientation of the route (which way should user turn to start walking)
   * - when user is walking the wrong way.
   * @param enabled
   */
  ttsHeadingCorrectionEnabled(enabled: boolean) {
    ProximiioMapboxNative.ttsHeadingCorrectionEnabled(enabled);
  }

  /**
   * Set thresholds to determine when is the heading correction triggered.
   * @param thresholdMeters distance from route to trigger correction. Default 3 meters.
   * @param thresholdDegrees degrees between current heading and heading towards correct route. Default 90 degrees.
   */
  ttsHeadingCorrectionThresholds(thresholdDistanceMeters: number, thresholdDegrees: number) {
    ProximiioMapboxNative.ttsHeadingCorrectionThresholds(thresholdDistanceMeters, thresholdDegrees);
  }

  ttsReassuranceInstructionEnabled(enabled: boolean) {
    ProximiioMapboxNative.ttsReassuranceInstructionEnabled(enabled);
  }

  ttsReassuranceInstructionDistance(distance: Number) {
    ProximiioMapboxNative.ttsReassuranceInstructionDistance(distance);
  }

  ttsRepeatLastInstruction() {
    ProximiioMapboxNative.ttsRepeatLastInstruction();
  }

  ttsHazardAlert(enabled: boolean, metadataKeys: number[] = []) {
    if (metadataKeys == undefined) metadataKeys = [];
    ProximiioMapboxNative.ttsHazardAlert(enabled, metadataKeys);
  }

  ttsSegmentAlert(emterEnabled: boolean, exitEnabled: boolean, metadataKeys: number[] = []) {
    if (metadataKeys == undefined) metadataKeys = [];
    ProximiioMapboxNative.ttsSegmentAlert(emterEnabled, exitEnabled, metadataKeys);
  }

  ttsDecisionAlert(enabled: boolean, metadataKeys: number[] = []) {
    if (metadataKeys == undefined) metadataKeys = [];
    ProximiioMapboxNative.ttsDecisionAlert(enabled, metadataKeys);
  }

  ttsLandmarkAlert(enabled: true, metadataKeys: number[] = []) {
    if (metadataKeys == undefined) metadataKeys = [];
    ProximiioMapboxNative.ttsLandmarkAlert(enabled, metadataKeys);
  }

  ttsLevelChangerMetadataKeys(metadataKeys: number[]) {
    if (metadataKeys == undefined) metadataKeys = [];
    ProximiioMapboxNative.ttsLevelChangerMetadataKeys(metadataKeys);
  }

  ttsDestinationMetadataKeys(metadataKeys: number[]) {
    if (metadataKeys == undefined) metadataKeys = [];
    ProximiioMapboxNative.ttsLevelChangerMetadataKeys(metadataKeys);
  }

  subscribe(event: string, fn: (data: any) => void) {
    return this.emitter.addListener(event, fn);
  }

  unsubscribe(event: string, fn: (data: any) => void) {
    return this.emitter.removeListener(event, fn);
  }
}

export default new ProximiioMapbox()
