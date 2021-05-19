import { AxiosInstance } from 'axios';
import { ProximiioUnitConversion } from './types';
import { Feature } from './feature';
import { ProximiioRouteManager } from './route_managerv2';
export declare type AmenityCategory = {
    id: string;
    name: string;
};
export declare type Amenity = {
    id: string;
    category_id: string;
    icon: string;
    title: string;
    description: string;
};
export declare enum ProximiioMapboxSyncStatus {
    INITIAL_WAITING = "INITIAL_WAITING",
    INITIAL_NETWORK_ERROR = "INITIAL_NETWORK_ERROR",
    INITIAL_RUNNING = "INITIAL_RUNNING",
    INITIAL_ERROR = "INITIAL_ERROR",
    INITIAL_FINISHED = "INITIAL_FINISHED",
    UPDATE_NETWORK_ERROR = "UPDATE_NETWORK_ERROR",
    UPDATE_RUNNING = "UPDATE_RUNNING",
    UPDATE_ERROR = "UPDATE_ERROR",
    UPDATE_FINISHED = "UPDATE_FINISHED"
}
export declare enum ProximiioMapboxEvents {
    FAILURE = "ProximiioMapboxInitialized",
    READY = "ProximiioMapboxFailed",
    LOCATION_UPDATED = "ProximiioMapboxLocationUpdate",
    ROUTE = "ProximiioMapbox.RouteEvent",
    ROUTE_UPDATE = "ProximiioMapbox.RouteEventUpdate",
    ON_LANDMARK = "ProximiioMapboxOnNavigationLandmark",
    ON_HAZARD = "ProximiioMapboxOnNavigationHazard",
    ON_SEGMENT = "ProximiioMapboxOnNavigationSegment",
    ON_DECISION = "ProximiioMapboxOnNavigationDecision",
    AMENITIES_CHANGED = "ProximiioMapboxAmenitiesChanged",
    FEATURES_CHANGED = "ProximiioMapboxFeaturesChanged",
    STYLE_CHANGED = "ProximiioMapboxStyleChanged",
    SYNC_STATUS = "ProximiioMapboxSyncStatusChanged"
}
export declare class ProximiioMapbox {
    token: string;
    style?: any;
    axios?: AxiosInstance;
    emitter: import("react-native").EventEmitter;
    route: ProximiioRouteManager;
    amenityCache: Amenity[];
    featureCache: Feature[];
    isLoadingFeatures: boolean;
    constructor();
    authorize(token: string): Promise<void>;
    get styleURL(): string;
    isReady(): Promise<boolean>;
    search(title: string): Promise<Feature[]>;
    getAmenityCategories(): Promise<AmenityCategory[]>;
    __amenitiesChanged(amenities: Amenity[]): void;
    __featuresChanged(features: Feature[]): Promise<void>;
    getAmenities(): Amenity[];
    getFeatures(): Feature[];
    syncFeatures(): Promise<void>;
    getStyle(): Promise<string>;
    getSyncStatus(): Promise<number>;
    startSyncNow(): void;
    setUnitConversion(unitConversion: ProximiioUnitConversion): void;
    setStepImmediateThreshold(thresholdInMeters: number): void;
    setStepPreparationThreshold(thresholdInMeters: number): void;
    setRouteFinishThreshold(thresholdInMeters: number): void;
    setRerouteEnabled(enabled: boolean): void;
    setReRouteThreshold(thresholdInMeters: number): void;
    setUserLocationToRouteSnappingEnabled(enabled: boolean): void;
    ttsEnabled(enabled: boolean): void;
    ttsHeadingCorrectionEnabled(enabled: boolean): void;
    ttsReassuranceInstructionEnabled(enabled: boolean): void;
    ttsReassuranceInstructionDistance(distance: Number): void;
    ttsRepeatLastInstruction(): void;
    ttsHazardAlert(enabled: boolean, metadataKeys?: number[]): void;
    ttsSegmentAlert(emterEnabled: boolean, exitEnabled: boolean, metadataKeys?: number[]): void;
    ttsDecisionAlert(enabled: boolean, metadataKeys?: number[]): void;
    ttsLandmarkAlert(enabled: true, metadataKeys?: number[]): void;
    ttsLevelChangerMetadataKeys(metadataKeys: number[]): void;
    ttsDestinationMetadataKeys(metadataKeys: number[]): void;
    subscribe(event: string, fn: (data: any) => void): import("react-native").EmitterSubscription;
    unsubscribe(event: string, fn: (data: any) => void): void;
}
declare const _default: ProximiioMapbox;
export default _default;
