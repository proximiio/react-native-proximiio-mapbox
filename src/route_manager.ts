import { NativeModules } from "react-native";
import { Eventable } from "./eventable";
import { ProximiioMapboxRoute } from './types';

const { ProximiioMapboxNative } = NativeModules;
const WALKING_SPEED = 0.833;

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
    super();
    this.onRouteStart = this.onRouteStart.bind(this);
    this.onRouteUpdate = this.onRouteUpdate.bind(this);
    this.onRouteCancel = this.onRouteCancel.bind(this)
  }

  describe() {
    return this.route?.descriptor
  }

  public onRouteStart = (route: ProximiioMapboxRoute) => {
    this.route = this.fixRoute(route);
    this.isStarted = true;
    this.notify(ProximiioRouteEvents.ROUTE_STARTED, route)
  }

  private fixRoute = (route: ProximiioMapboxRoute) => {
    if (route && route.descriptor) {
      if (typeof route.descriptor.distanceMeters === 'undefined') {
        route.descriptor.distanceMeters = route.descriptor.steps.reduce((acc, item) => acc += ((item as any).distanceFromLastStep), 0)
      }
      route.descriptor.duration = route.descriptor.distanceMeters / WALKING_SPEED;
    }
    return route
  }

  public onRouteUpdate = (route: ProximiioMapboxRoute) => {
    if (route.descriptor) {
      this.route = this.fixRoute(route);
      this.notify(ProximiioRouteEvents.ROUTE_UPDATED, route)
    }
  }

  public onRouteCancel = (evt: RouteCancelEvent) => {
    this.route = undefined;
    this.isStarted = false;
    this.notify(ProximiioRouteEvents.ROUTE_CANCELED, evt)
  }

  find(poi_id: string, preview: boolean) {
    if (this.isStarted) {
      this.cancel()
    }
    this.isPreview = preview
    ProximiioMapboxNative.routeFind(poi_id, this.routeOptions, preview, !preview);
  }

  // allows you to specify custom destination
  findTo(lat: number, lng: number, level: number, preview: boolean) {
    if (this.isStarted) {
      this.cancel()
    }
    this.isPreview = preview
    ProximiioMapboxNative.routeFindTo(lat, lng, level, this.routeOptions, preview, !preview);
  }

  // allows you to specify custom start location
  findFrom(latFrom: number, lngFrom: number, levelFrom: number, latTo: number, lngTo: number, levelTo: number, title: string, preview: boolean) {
    if (this.isStarted) {
      this.cancel()
    }
    this.isPreview = preview
    ProximiioMapboxNative.routeFindFrom(latFrom, lngFrom, levelFrom, latTo, lngTo, levelTo, title, this.routeOptions, preview, !preview);
  }
  
  findBetween(idFrom: string, idTo: string, preview: boolean) {
    if (this.isStarted) {
      this.cancel()
    }
    this.isPreview = preview
    ProximiioMapboxNative.routeFindBetween(idFrom, idTo, this.routeOptions, preview, !preview);
  }

  calculate(latFrom: number, lngFrom: number, levelFrom: number, latTo: number, lngTo: number, levelTo: number, title: string) {
    ProximiioMapboxNative.routeCalculate(latFrom, lngFrom, levelFrom, latTo, lngTo, levelTo, title, this.routeOptions);
  }

  // start the navigation
  start() {
    ProximiioMapboxNative.routeStart();
    this.isStarted = true
  }

  // stop navigation, removes the path from map.
  cancel() {
    ProximiioMapboxNative.routeCancel();
    this.isStarted = false
  }
}
