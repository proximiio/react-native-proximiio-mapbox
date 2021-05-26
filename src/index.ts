export { AmenitySource } from './amenity_source';
export { UserLocationSource } from './user_location_source';
export { GeoJSONSource } from './geojson_source'
export { RoutingSource } from './routing_source'
export {
  Amenity,
  AmenityCategory,
  ProximiioMapbox,
  ProximiioMapboxSyncStatus,
  ProximiioMapboxEvents
} from './instance'
export {
  FeatureCollection,
  ProximiioMapboxRoute,
  ProximiioUnitConversion,
  ProximiioFeatureType,
  ProximiioRouteEvent,
  ProximiioWayfindingOptions,
  ProximiioRouteConfiguration,
  ProximiioRouteUpdateType,
  RouteStepDescriptor,
  RouteStepSymbol
} from './types'
export { Feature } from './feature'
import instance from './instance'
export default instance;

