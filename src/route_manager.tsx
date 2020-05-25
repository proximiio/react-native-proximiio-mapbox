import { NativeModules } from "react-native";
import { Eventable } from "./eventable";
import { ProximiioMapboxRoute } from './types';

const { ProximiioMapboxNative } = NativeModules;

export enum ProximiioRouteEvents {
  ROUTE_STARTED = 'proximiio:route:started',
  ROUTE_UPDATED = 'proximiio:route:updated',
  ROUTE_CANCELED = 'proximiio:route:canceled'
}

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

export type RouteStartEvent = {};
export type RouteUpdateEvent = {};
export type RouteCancelEvent = {};

export class ProximiioRouteManager extends Eventable {
  route?: ProximiioMapboxRoute
  distance: number = 0
  isStarted: boolean = false
  isPreview: boolean = false
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
    super()
  }

  describe() {
    return this.route?.descriptor
  }

  onRouteStart(route: ProximiioMapboxRoute) {
    // console.log('RouteManager => onRouteStart', route)
    this.route = route
    this.notify(ProximiioRouteEvents.ROUTE_STARTED, route)
  }

  onRouteUpdate(route: ProximiioMapboxRoute) {
    // console.log('RouteManager => onRouteUpdate', route)
    this.route = route
    this.notify(ProximiioRouteEvents.ROUTE_UPDATED, route)
  }

  onRouteCancel(evt: RouteCancelEvent) {
    // console.log('RouteManager => onRouteCancel', evt)
    this.route = undefined
    this.notify(ProximiioRouteEvents.ROUTE_CANCELED, evt)
  }

  find(poi_id: string, previewRoute: boolean) {
    ProximiioMapboxNative.routeFind(poi_id, this.routeOptions, previewRoute, !previewRoute);
  }

  // allows you to specify custom destination
  findTo(lat: number, lng: number, level: number, preview: boolean) {
    ProximiioMapboxNative.routeFindTo(lat, lng, level, this.routeOptions, preview, !preview);
  }

  // allows you to specify custom start location
  findFrom(latFrom: number, lngFrom: number, levelFrom: number, latTo: number, lngTo: number, levelTo: number, title: string, preview: boolean) {
    ProximiioMapboxNative.routeFindFrom(latFrom, lngFrom, levelFrom, latTo, lngTo, levelTo, title, this.routeOptions, preview, !preview);
  }

  calculate(latFrom: number, lngFrom: number, levelFrom: number, latTo: number, lngTo: number, levelTo: number, title: string) {
    ProximiioMapboxNative.routeCalculate(latFrom, lngFrom, levelFrom, latTo, lngTo, levelTo, title, this.routeOptions);
  }

  // start the navigation
  start() {
    ProximiioMapboxNative.routeStart();
  }

  // stop navigation, removes the path from map.
  cancel() {
    ProximiioMapboxNative.routeCancel();
  }
}