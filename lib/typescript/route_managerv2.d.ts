import { Eventable } from "./eventable";
import { ProximiioMapboxRoute, ProximiioRouteConfiguration, ProximiioRouteEvent } from './types';
export declare enum ProximiioRouteEvents {
    ROUTE_CALCULATED = "proximiio:route:calculated",
    ROUTE_UPDATED = "proximiio:route:updated",
    ROUTE_PREVIEWED = "proximiio:route:previewed",
    ROUTE_ENDED = "proximiio:route:ended"
}
export declare class ProximiioRouteManager extends Eventable {
    route?: ProximiioMapboxRoute;
    routePreviewed: boolean;
    routeStarted: boolean;
    constructor();
    /**
     * @return {Promise<ProximiioRoute>}
     */
    calculate(routeConfiguration: ProximiioRouteConfiguration): any;
    /**
     * Find route to navigate on, but do not start navigation or preview it on map.
     */
    find(routeConfiguration: ProximiioRouteConfiguration): void;
    /**
     * Find route to navigate on, but do not start navigation, only preview it on map.
     */
    findAndPreview(routeConfiguration: ProximiioRouteConfiguration): void;
    /**
     * Find route to navigate on, and immediately start navigation.
     */
    findAndStart(routeConfiguration: ProximiioRouteConfiguration): void;
    /**
     * Preview route on map. Returns true if route preview was enabled.
     */
    preview(): boolean;
    private _platformRouteConfiguration;
    /**
     * Start prepared route (that is, of the te routeFind* methods was called before and route was successfully found).
     */
    start(): boolean;
    /**
     * Stops current navigation, or route preview (removes the path from map).
     */
    cancel(): void;
    /**
     *
     * @param route
     */
    onCalculated(route?: ProximiioMapboxRoute): void;
    onUpdate(event: ProximiioRouteEvent): void;
}
