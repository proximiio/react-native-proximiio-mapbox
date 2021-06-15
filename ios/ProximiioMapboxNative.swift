import Proximiio;
import ProximiioMapbox;
import SwiftyJSON;

enum ProximiioMapboxNativeError: Error {
    case destinationNotSpecified
    case destinationNotFound
}

@objc(ProximiioMapboxNative)
class ProximiioMapboxNative: RCTEventEmitter, ProximiioMapboxNavigation {
    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    var instance = ProximiioMapbox.shared
    var lastLocation : ProximiioLocation?
    var lastLevel = NSNumber(0)
    var lastRoute : PIORoute?
    var hasListeners = false
    var ready = false
    var syncStatus = "INITIAL_WAITING"
    var amenitiesCache : Array<NSDictionary> = Array()
    var featuresCache : Array<NSDictionary> = Array()
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
    
    override func supportedEvents() -> [String]! {[
        "ProximiioMapboxInitialized",
        "ProximiioMapboxFailed",
        "ProximiioMapboxRouteStarted",
        "ProximiioMapboxRouteCanceled",
        "ProximiioMapboxRouteUpdated",
        "ProximiioMapboxOnNavigationLandmark",
        "ProximiioMapboxOnNavigationHazard",
        "ProximiioMapboxOnNavigationSegment",
        "ProximiioMapboxOnNavigationDecision",
        "ProximiioMapboxAmenitiesChanged",
        "ProximiioMapboxFeaturesChanged",
        "ProximiioMapboxStyleChanged",
        "ProximiioMapboxSyncStatusChanged",
        "ProximiioMapboxFeaturesChangedInternal",
        "ProximiioMapboxAmenitiesChangedInternal",
        "ProximiioMapbox.RouteEventUpdate",
        "ProximiioMapbox.RouteEvent",
        "ProximiioMapboxLocationUpdate",
        "ProximiioMapbox.RouteEvent",
        "ProximiioMapbox.RouteEventUpdate"

    ]}
    
    @objc(authorize:resolver:rejecter:)
    func authorize(_ token: String, resolver resolve:@escaping RCTPromiseResolveBlock, rejecter reject:@escaping RCTPromiseRejectBlock) -> Void {
        updateSyncStatus("INITIAL_WAITING")
        self.ready = false
        let config = ProximiioMapboxConfiguration(token: token)
        instance.setup(mapView: nil, configuration: config)
        instance.mapNavigation = self
        instance.initialize { authResult in
            switch authResult {
                case .failure: reject("AUTH_FAILURE", "Authorization Failed", nil)
                case .invalid: reject("AUTH_FAILURE", "Authorization Invalid", nil)
                case .success:
                    self._synchronize(initial: true) { success in
                        if (success) {
                            // self.instance.routeCancel(silent: true)
                            self.ready = true
                            resolve(["ready": true])
                            self.startDatabaseObserver()
                        } else {
                            reject("SYNC_FAILURE", "Initial Synchronization Failed", nil)
                        }
                    }
            }
        }
    }
    
    @objc(getAmenities:reject:)
    func getAmenities(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        resolve(getConvertedAmenities())
    }
    
    @objc(getFeatures:reject:)
    func getFeatures(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        resolve(getConvertedFeatures())
    }
    
    @objc(getSyncStatus:reject:)
    func getSyncStatus(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        resolve(syncStatus)
    }
    
    @objc(synchronize:reject:)
    func synchronize(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        _synchronize(initial: false) { success in
            if (success) {
                resolve(["success": true])
            } else {
                reject("SYNC FAILURE", "Update Synchronization Failed", nil)
            }
        }
    }
    
    @objc(updateLocation:longitude:sourceType:accuracy:resolver:rejecter:)
    func updateLocation(_ latitude: NSNumber, longitude: NSNumber, sourceType: String, accuracy: NSNumber, resolver resolve:RCTPromiseResolveBlock, rejecter reject:RCTPromiseRejectBlock) -> Void {
        let location = ProximiioLocation(latitude: latitude.doubleValue, longitude: longitude.doubleValue, horizontalAccuracy: accuracy.floatValue)
        location.sourceType = sourceType
        instance.userLocation = location
        lastLocation = location
        resolve(convertLocation(location))
    }
    
    @objc(updateLevel:resolve:reject:)
    func updateLevel(level: NSNumber, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        lastLevel = level
    }
    
    @objc(routeCalculate:resolve:reject:)
    func routeCalculate(configuration: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        do {
            let config = try convertDictionaryToRouteConfiguration(data: configuration)
            instance.routeCalculate(configuration: config) { route in
                self._handleRoute(route: route, resolve: resolve, reject: reject)
            }
        } catch ProximiioMapboxNativeError.destinationNotFound {
            reject("ROUTE_ERROR", "Destination not found", nil)
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("ROUTE_ERROR", "Destination not specified", nil)
        } catch {
            reject("ROUTE_ERROR", "Unknown Error", nil)
        }
    }
    
    @objc(routeFind:resolve:reject:)
    func routeFind(configuration: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        do {
            let config = try convertDictionaryToRouteConfiguration(data: configuration)
            instance.routeFind(configuration: config) { route in
                self._handleRoute(route: route, resolve: resolve, reject: reject)
            }
        } catch ProximiioMapboxNativeError.destinationNotFound {
            reject("ROUTE_ERROR", "Destination not found", nil)
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("ROUTE_ERROR", "Destination not specified", nil)
        } catch {
            reject("ROUTE_ERROR", "Unknown Error", nil)
        }
    }
    
    @objc(routeFindAndPreview:resolve:reject:)
    func routeFindAndPreview(configuration: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        do {
            let config = try convertDictionaryToRouteConfiguration(data: configuration)
            instance.routeFindAndPreview(configuration: config) { route in
                self._handleRoute(route: route, resolve: resolve, reject: reject)
            }
        } catch ProximiioMapboxNativeError.destinationNotFound {
            reject("ROUTE_ERROR", "Destination not found", nil)
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("ROUTE_ERROR", "Destination not specified", nil)
        } catch {
            reject("ROUTE_ERROR", "Unknown Error", nil)
        }
    }
    
    @objc(routeFindAndStart:resolve:reject:)
    func routeFindAndStart(configuration: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        do {
            let config = try convertDictionaryToRouteConfiguration(data: configuration)
            instance.routeFindAndStart(configuration: config) { route in
                self._handleRoute(route: route, resolve: resolve, reject: reject)
            }
        } catch ProximiioMapboxNativeError.destinationNotFound {
            reject("ROUTE_ERROR", "Destination not found", nil)
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("ROUTE_ERROR", "Destination not specified", nil)
        } catch {
            reject("ROUTE_ERROR", "Unknown Error", nil)
        }
    }
    
    @objc(routeStart:reject:)
    func routeStart(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        instance.routeStart()
        resolve(true)
    }
    
    @objc(routeCancel:reject:)
    func routeCancel(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        instance.routeCancel(silent: true)
        resolve(true)
    }
    
    @objc(setUnitConversion:)
    func setUnitConversion(unitConversion: NSDictionary) -> Void {
        // TODO
    }
    
    @objc(setStepImmediateThreshold:)
    func setStepImmediateThreshold(thresholdInMeters: NSNumber) -> Void {
        // TODO
    }
    
    @objc(setStepPreparationThreshold:)
    func setStepPreparationThreshold(thresholdInMeters: NSNumber) -> Void {
        // TODO
    }
    
    @objc(setRouteFinishThreshold:)
    func setRouteFinishThreshold(thresholdInMeters: NSNumber) -> Void {
        // TODO
    }
    
    @objc(setRerouteEnabled:)
    func setRerouteEnabled(enabled: NSNumber) -> Void {
        // TODO
    }
    
    @objc(setReRouteThreshold:)
    func setReRouteThreshold(thresholdInMeters: NSNumber) -> Void {
        // TODO
    }
    
    // TTS
    
    @objc(ttsEnable:reject:)
    func ttsEnable(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        // TODO
        resolve(false)
    }
    
    @objc(ttsDisable)
    func ttsDisable() -> Void {
        // TODO
    }
    
    @objc(ttsHeadingCorrectionEnabled:)
    func ttsHeadingCorrectionEnabled(enabled: NSNumber) -> Void {
        // TODO
    }
    
    @objc(ttsHeadingCorrectionThresholds:thresholdDegrees:)
    func ttsHeadingCorrectionThresholds(_ thresholdInMeters: NSNumber, thresholdDegrees: NSNumber) -> Void {
        // TODO
    }
    
    @objc(ttsReassuranceInstructionEnabled:)
    func ttsReassuranceInstructionEnabled(enabled: NSNumber) -> Void {
        // TODO
    }
    
    @objc(ttsReassuranceInstructionDistance:)
    func ttsReassuranceInstructionEnabled(distance: NSNumber) -> Void {
        // TODO
    }
    
    @objc(ttsRepeatLastInstruction)
    func ttsRepeatLastInstruction() -> Void {
        // TODO
    }
    
    @objc(ttsHazardAlert:metadataKeys:)
    func ttsHazardAlert(enabled: NSNumber, metadataKeys: NSArray) -> Void {
        // TODO
    }
    
    @objc(ttsSegmentAlert:exitEnabled:metadataKeys:)
    func ttsSegmentAlert(enterEnabled: NSNumber, exitEnabled: NSNumber, metadataKeys: NSArray) -> Void {
        // TODO
    }
    
    @objc(ttsDecisionAlert:metadataKeys:)
    func ttsDecisionAlert(enabled: NSNumber, metadataKeys: NSArray) -> Void {
        // TODO
    }
    
    @objc(ttsLandmarkAlert:metadataKeys:)
    func ttsLandmarkAlert(enabled: NSNumber, metadataKeys: NSArray) -> Void {
        // TODO
    }
    
    @objc(setUserLocationToRouteSnappingEnabled:)
    func setUserLocationToRouteSnappingEnabled(enabled: NSNumber) -> Void {
        // TODO
    }
    
    @objc(setUserLocationToRouteSnappingThreshold:)
    func setUserLocationToRouteSnappingThreshold(threshold: NSNumber) -> Void {
        // TODO
    }
    
    @objc(ttsLevelChangerMetadataKeys:)
    func ttsLevelChangerMetadataKeys(metadataKeys: NSArray) -> Void {
        // TODO
    }
    
    @objc(ttsDestinationMetadataKeys:)
    func ttsDestinationMetadataKeys(metadataKeys: NSArray) -> Void {
        // TODO
    }
    
    @objc(setLevelOverrideMap:)
    func setLevelOverrideMap(overrideMap: NSDictionary) -> Void {
        // TODO
    }
    
    // PRIVATE FUNCTIONS
    
    private func _handleRoute(route: PIORoute?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        lastRoute = route
        if (route != nil) {
            let convertedRoute = self._convertRoute(route: route, nodeIndex: nil, position: nil)
            resolve(convertedRoute)
            _sendEvent(name: "ProximiioMapbox.RouteEvent", body: convertedRoute)
        } else {
            reject("ROUTE_NOT_FOUND", "Route not found", nil)
        }
    }
    
    private func _convertRoute(route: PIORoute?, nodeIndex: Int?, position: CLLocationCoordinate2D?) -> NSDictionary {
        if (route == nil) {
            return NSDictionary()
        }
        
        let routeMap = self.convertPIORouteToDictionary(route: route!)
        let features = NSMutableArray()
        
        if (nodeIndex != nil && position != nil) {
            let remaining = route?.lineStringFrom(startNodeIndex: nodeIndex!,
                                                  firstPoint: position!)

            remaining?.forEach({ feature in
                feature.identifier = "route-node-remaining-\(remaining!.firstIndex(of: feature) ?? 0)"
                features.add(feature.toDictionary())
            })
            
            let completed = route?.lineStringUntil(endNodeIndex: nodeIndex!,
                                                   lastPoint: position!)
            
            completed?.forEach({ feature in
                feature.identifier = "route-node-completed-\(completed!.firstIndex(of: feature) ?? 0)"
                feature.properties["completed"] = true
                features.add(feature.toDictionary())
            })
        } else {
            let list = route?.getLineStringFeatureList()
            list!.forEach({ feature in
                feature.identifier = "route-node-\(list!.firstIndex(of: feature) ?? 0)"
                features.add(feature.toDictionary())
            })
        }
        
        routeMap["features"] = features
        return routeMap
    }
    
    private func _synchronize(initial: Bool, completion: @escaping (Bool) -> ()) -> Void {
        self.updateSyncStatus(initial ? "INITIAL_RUNNING" : "UPDATE_RUNNING")
        Proximiio.sharedInstance().syncAmenities { completed in
            if (completed) {
                self.amenitiesCache = self.instance.database.amenities().map { self.convertAmenityToDictionary($0) }
                self.amenitiesChanged()
                Proximiio.sharedInstance().syncFeatures { completed in
                    if (completed) {
                        self.featuresCache = self.instance.database.features().map { $0.toDictionary() as NSDictionary }
                        self.updateSyncStatus(initial ? "INITIAL_FINISHED" : "UPDATE_FINISHED")
                        self.featuresChanged()
                        completion(true)
                    } else {
                        self.updateSyncStatus("INITIAL_ERROR")
                        completion(false)
                    }
                }
            } else {
                self.updateSyncStatus("INITIAL_ERROR")
                completion(false)
            }
        }
    }
    
    private func getConvertedAmenities() -> Array<NSDictionary> {
        return self.amenitiesCache
    }
    
    private func getConvertedFeatures() -> Array<NSDictionary> {
        return self.featuresCache
    }
    
    private func amenitiesChanged() -> Void {
        self._sendEvent(name: "ProximiioMapboxAmenitiesChangedInternal", body:self.getConvertedAmenities());
    }
    
    private func featuresChanged() -> Void {
        self._sendEvent(name: "ProximiioMapboxFeaturesChangedInternal", body:self.getConvertedFeatures());
    }

    private func convertAmenityToDictionary(_ amenity: ProximiioAmenity) -> NSDictionary {
        let iconOffset = amenity.iconOffset == nil ? NSArray() : NSArray(array: [amenity.iconOffset[0], amenity.iconOffset[1]])
        return NSDictionary(dictionary: [
            "id": amenity.identifier as String,
            "icon": amenity.icon as String,
            "iconOffset": iconOffset,
            "category": amenity.category as String,
        ])
    }

    private func convertProximiioGeoJSONtoDictionary(_ feature: ProximiioGeoJSON) -> NSDictionary {
        return feature.toDictionary() as NSDictionary
    }
    
    private func convertLocation(_ location: ProximiioLocation) -> NSDictionary {
        let data = NSMutableDictionary(dictionary: [
            "lat": location.coordinate.latitude,
            "lng": location.coordinate.longitude
        ])
        
        data["sourceType"] = location.sourceType as String? != nil ? location.sourceType : "unknown"
        data["accuracy"] = location.horizontalAccuracy > 0 ? location.horizontalAccuracy : 0
        
        return data;
    }
    
    private func convertRouteOptions(data: NSDictionary) -> PIOWayfindingOptions {
        return PIOWayfindingOptions(avoidElevators: data["avoidElevators"] as! Bool? ?? false,
                                    avoidBarriers: data["avoidBarriers"]  as! Bool? ?? false,
                                    avoidEscalators: data["avoidEscalators"] as! Bool? ?? false,
                                    avoidNarrowPaths: data["avoidNarrowPaths"] as! Bool? ?? false,
                                    avoidRamps: data["avoidRamps"] as! Bool? ?? false,
                                    avoidRevolvingDoors: data["avoidRevolvingDoors"] as! Bool? ?? false,
                                    avoidStaircases: data["avoidStaircases"] as! Bool? ?? false,
                                    avoidTicketGates: data["avoidTicketGates"] as! Bool? ?? false,
                                    pathFixDistance: ((data["pathFixDistance"] as! NSNumber?) ?? NSNumber(1.0)).doubleValue)
    }
    
    private func convertPIOWayfindingOptionsToDictionary(options: PIOWayfindingOptions) -> NSDictionary {
        // TODO make PIOWayfindingOptions.toJSON public
        return NSDictionary()
    }
    
    private func convertDictionaryToRouteConfiguration(data: NSDictionary) throws -> PIORouteConfiguration {
        var start : ProximiioGeoJSON?
        var destination : ProximiioGeoJSON?
        
        if (data["startFeatureId"] != nil) {
            let results = instance.database.features(search: data["startFeatureId"] as! String)
            if (results.count == 1) {
                start = results.first
            }
        }
        
        if (data["startLatLonLevel"] != nil && lastLocation != nil && (data["startLatLonLevel"] as! Array<NSNumber>).count == 3) {
            let _data = data["startLatLonLevel"] as! Array<NSNumber>
            start = ProximiioGeoJSON(dictionary: [
                "type": "Feature",
                "geometry": [
                    "type": "Point",
                    "coordinates": [ _data[1], _data[0] ]
                ],
                "properties": [
                    "level": _data[2]
                ]
            ])
        }
        
        if (start == nil && lastLocation != nil) {
            start = ProximiioGeoJSON(dictionary: [
                "type": "Feature",
                "geometry": [
                    "type": "Point",
                    "coordinates": [lastLocation!.coordinate.longitude, lastLocation!.coordinate.latitude ]
                ],
                "properties": [
                    "level": lastLevel
                ]
            ])
        }
        
        if (data["destinationFeatureId"] != nil) {
//            let results = instance.database.features(search: data["destinationFeatureId"] as! String)
            let results = instance.database.features().filter { feature in
                feature.identifier as String == data["destinationFeatureId"] as! String
            }
            if (results.count == 1) {
                destination = results.first
            } else {
                throw ProximiioMapboxNativeError.destinationNotFound
            }
        }
        
        if (data["destinationLatLonLevel"] != nil && lastLocation != nil && (data["destinationLatLonLevel"] as! Array<NSNumber>).count == 3) {
            let _data = data["destinationLatLonLevel"] as! Array<NSNumber>
            destination = ProximiioGeoJSON(dictionary: [
                "type": "Feature",
                "geometry": [ _data[1], _data[0] ],
                "properties": [
                    "level": _data[2]
                ]
            ])
        }
        
        if (destination == nil) {
            throw ProximiioMapboxNativeError.destinationNotSpecified
        }
        
        
        let options = data["wayfindingOptions"] != nil ? convertRouteOptions(data: data["wayfindingOptions"] as! NSDictionary) : getDefaultWayfindingOptions()
        
        return PIORouteConfiguration(start: start,
                                     destination: destination!,
                                     waypointList: [],
                                     wayfindingOptions: options)
    }
    
    private func convertPIORouteToDictionary(route: PIORoute) -> NSMutableDictionary {
        return NSMutableDictionary(dictionary: [
            "configuration": self.convertPIORouteConfigurationToDictionary(config: route.configuration),
            "destination": route.destination.toDictionary() as NSDictionary,
            "distanceCustom": route.summary["distanceCustom"] as! NSNumber,
            "distanceCustomUnit": route.summary["distanceCustomUnit"] as! NSString,
            "distanceMeters": route.summary["distanceMeters"] as! NSNumber,
            "lastNodeWithPathIndex": (route.summary["steps"] as! NSArray).count - 1,
            "steps": route.summary["steps"]!
        ])
    }
    
    private func convertPIORouteConfigurationToDictionary(config: PIORouteConfiguration) -> NSDictionary {
        let data = NSDictionary(dictionary: [
            "start": config.start?.toJSON() ?? NSDictionary() as Any,
            "destination": convertProximiioGeoJSONtoDictionary(config.destination),
            "wayfindingOptions": self.convertPIOWayfindingOptionsToDictionary(options: config.wayfindingOptions),
            "waypoingList": NSArray()
        ])
        return data
    }
    
    private func getDefaultWayfindingOptions() -> PIOWayfindingOptions {
        return PIOWayfindingOptions(avoidElevators: false,
                                    avoidBarriers: false,
                                    avoidEscalators: false,
                                    avoidNarrowPaths: false,
                                    avoidRamps: false,
                                    avoidRevolvingDoors: false,
                                    avoidStaircases: false,
                                    avoidTicketGates: false,
                                    pathFixDistance: 1.0)
    }
    
    private func startDatabaseObserver() -> Void {
        
    }
    
    private func updateSyncStatus(_ status: String) -> Void {
        syncStatus = status
    }
    
    private func _sendEvent(name: String, body: Any) -> Void {
        if (hasListeners) {
            NSLog("ProximiioMapboxNative -> sending event: \(name) body: \(body)")
            self.sendEvent(withName: name, body: body)
        }
    }
    
    // dummy delegates we dont need
    func onRoute(route: PIORoute?) {
//        NSLog("onRoute: \(route)")
    }
    
    func routeEvent(eventType type: PIORouteUpdateType, text: String, additionalText: String?, data: PIORouteUpdateData?) {
        NSLog("onRouteEvent: \(type) \(text) \(additionalText ?? "none") \(data ?? NSDictionary())")
        var eventType = "UNKNOWN"
        
        switch type {
            case .calculating: eventType = "CALCULATING"
            case .canceled: eventType = "CANCELED"
            case .finished: eventType = "FINISHED"
            case .immediate: eventType = "IMMEDIATE"
            case .new: eventType = "NEW"
            case .osrmNetworkError: eventType = "OSRM_NETWORK_ERROR"
            case .recalculating: eventType = "RECALCULATING"
            case .routeNotfound: eventType = "ROUTE_NOT_FOUND"
            case .soon: eventType = "SOON"
            case .update: eventType = "UPDATE"
        }
        
        let body = NSMutableDictionary(dictionary: [
            "eventType": eventType,
            "text": text,
            "additionalText": additionalText ?? ""
        ])
        
        var _data = NSDictionary()
        
        if (data != nil) {
            _data = NSDictionary(dictionary: [
                "nodeIndex": data?.nodeIndex,
                "stepBearing": data?.stepBearing,
                "stepDirection": data?.stepDirection,
                "stepDistance": data?.stepDistance,
                "stepDistanceTotal": data?.stepDistanceTotal,
                "nextStepDistance": data?.nextStepDistance,
                "nextStepDirection": data?.nextStepDirection,
                "position": [
                    "latitude": data?.position.latitude,
                    "longitude": data?.position.longitude
                ],
                "pathLengthRemaining": data?.pathLengthRemaining
            ])
        }
        
        body["data"] = _data
        body["route"] = _convertRoute(route: lastRoute, nodeIndex: data?.nodeIndex, position: data?.position)
        _sendEvent(name: "ProximiioMapbox.RouteEventUpdate", body: body)
    }
    
    func onHazardEntered(_ hazard: ProximiioGeoJSON) {
        
    }
    
    func onSegmentEntered(_ segment: ProximiioGeoJSON) {
        
    }
    
    func onDecisionEntered(_ decision: ProximiioGeoJSON) {
        
    }
    
    func onLandmarkEntered(_ landmarks: [PIOLandmark]) {
        
    }
    
    func onHazardExit(_ hazard: ProximiioGeoJSON) {
        
    }
    
    func onSegmentExit(_ segment: ProximiioGeoJSON) {
        
    }
    
    func onDecisionExit(_ decision: ProximiioGeoJSON) {
        
    }
    
    func onLandmarkExit(_ landmarks: [ProximiioGeoJSON]) {
        
    }
    
    func onPositionUpdate(_ position: CLLocationCoordinate2D) {
        
    }
    
    func onHeadingUpdate(_ heading: Double) {
        
    }
    
    func onTTS() {
        
    }
    
    func onTTSDirection(text: String?) {
        
    }
}
