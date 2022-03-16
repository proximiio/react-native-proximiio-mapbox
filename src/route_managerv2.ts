import { NativeModules, Platform } from "react-native";
import { Eventable } from "./eventable";
import {ProximiioMapboxRoute, ProximiioRouteConfiguration, ProximiioRouteEvent} from './types';
import { isIOS } from "./helpers";

const { ProximiioMapboxNative } = NativeModules;

export enum ProximiioRouteEvents {
  ROUTE_CALCULATED = 'proximiio:route:calculated',
  ROUTE_UPDATED = 'proximiio:route:updated',
  ROUTE_PREVIEWED = 'proximiio:route:previewed',
  ROUTE_ENDED = 'proximiio:route:ended',
}

export class ProximiioRouteManager extends Eventable {

  route?: ProximiioMapboxRoute
  routePreviewed: boolean = false
  routeStarted: boolean = false

  constructor() {
    super();
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  /* Route Calculation */

  /**
   * @return {Promise<ProximiioRoute>}
   */
  calculate(routeConfiguration: ProximiioRouteConfiguration) {
    return ProximiioMapboxNative.routeCalculate(this._platformRouteConfiguration(routeConfiguration));
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  /* Route Navigation */

  /**
   * Find route to navigate on, but do not start navigation or preview it on map.
   */
  public find(routeConfiguration: ProximiioRouteConfiguration) {
    this.routeStarted = false
    this.routePreviewed = false
    ProximiioMapboxNative.routeFind(this._platformRouteConfiguration(routeConfiguration));
  }

  /**
   * Find route to navigate on, but do not start navigation, only preview it on map.
   */
  public findAndPreview(routeConfiguration: ProximiioRouteConfiguration) {
    this.routeStarted = false
    this.routePreviewed = true
    ProximiioMapboxNative.routeFindAndPreview(this._platformRouteConfiguration(routeConfiguration));
  }

  /**
   * Find route to navigate on, and immediately start navigation.
   */
  public findAndStart(routeConfiguration: ProximiioRouteConfiguration) {
    this.routeStarted = true
    this.routePreviewed = true
    ProximiioMapboxNative.routeFindAndStart(this._platformRouteConfiguration(routeConfiguration));
  }

  /**
   * Preview route on map. Returns true if route preview was enabled.
   */
  public preview() {
    if (this.route != null && this.routePreviewed && !this.routeStarted) {
      return false;
    } else {
      this.routePreviewed = true
      this.notify(ProximiioRouteEvents.ROUTE_PREVIEWED)
      return true;
    }
  }

  private _platformRouteConfiguration(routeConfiguration: ProximiioRouteConfiguration) {
    if (isIOS) {
      return routeConfiguration
    } else {
      return JSON.stringify(routeConfiguration)
    }
  }

  /**
   * Start prepared route (that is, of the te routeFind* methods was called before and route was successfully found).
   */
  public async start() {
    if (this.route != null && !this.routeStarted) {
      this.routeStarted = true
      await ProximiioMapboxNative.routeStart();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Stops current navigation, or route preview (removes the path from map).
   */
  public async cancel() {
    await ProximiioMapboxNative.routeCancel();
    this.routeStarted = false
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  /* Event handling */

  /**
   *
   * @param route
   */
  public onCalculated(route?: ProximiioMapboxRoute) {
    this.route = route
    this.notify(ProximiioRouteEvents.ROUTE_CALCULATED, route)
  }

  public onUpdate(event: ProximiioRouteEvent) {
    // Test route end
    if (
      event.eventType == 'FINISHED'
      || event.eventType == 'CANCELED'
      || event.eventType == 'ROUTE_NOT_FOUND'
      || event.eventType == 'ROUTE_OSRM_NETWORK_ERROR'
    ) {
      this.routeStarted = false;
      this.routePreviewed = false;
      this.route = undefined;
      this.notify(ProximiioRouteEvents.ROUTE_ENDED, event);
    } else {
      this.route = event.route;
      this.notify(ProximiioRouteEvents.ROUTE_UPDATED, event);
    }
  }
}
