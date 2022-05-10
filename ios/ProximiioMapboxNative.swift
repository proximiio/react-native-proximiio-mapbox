import Proximiio
import ProximiioMapLibre
import ProximiioProcessor
import SwiftyJSON

enum ProximiioMapboxNativeError: Error {
    case destinationNotSpecified
    case destinationNotFound
}

@objc(ProximiioMapboxNative)
class ProximiioMapboxNative: RCTEventEmitter, ProximiioMapLibreNavigation {

    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    var instance = ProximiioMapLibre.shared;

    var lastLocation : ProximiioLocation?
    var lastLevel = NSNumber(0)
    var lastRoute : PIORoute?
    var hasListeners = false
    var ready = false
    var snapEnabled = false
    var syncStatus = "INITIAL_WAITING"
    var amenitiesCache : Array<NSDictionary> = Array()
    var featuresCache : Array<NSDictionary> = Array()

    let snap = ProximiioSnapProcessor()

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    override func supportedEvents() -> [String]! {[
        "ProximiioFloorChanged",
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
        "ProximiioMapbox.RouteEventUpdate",
        "ProximiioMapboxOnNavigationLandmark",
        "ProximiioMapboxOnNavigationHazard",
        "ProximiioMapboxOnNavigationSegment",
        "ProximiioMapboxOnNavigationDecision",
        "ProximiioMapboxAmenitiesChangedInternal",
        "ProximiioMapboxSyncStatusChanged",
        "ProximiioMapboxFeaturesChangedInternal",
        "ProximiioMapboxStyleChanged"

    ]}

    @objc(authorize:resolver:rejecter:)
    func authorize(_ token: String, resolver resolve:@escaping RCTPromiseResolveBlock, rejecter reject:@escaping RCTPromiseRejectBlock) -> Void {
        updateSyncStatus("INITIAL_WAITING")
        self.ready = false
        let config = ProximiioMapLibreConfiguration(token: token)
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
            reject("ROUTE_NOT_FOUND", "Destination not found", nil)
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("ROUTE_NOT_FOUND", "Destination not specified", nil)
        } catch {
            reject("ROUTE_NOT_FOUND", "Unknown Error", nil)
        }
    }

    @objc(routeFind:resolve:reject:)
    func routeFind(configuration: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        do {
            let config = try convertDictionaryToRouteConfiguration(data: configuration)
            instance.routeFind(configuration: config) { route in
                self.lastRoute = route
                if (route != nil) {
                    let convertedRoute = self._convertRoute(route: route, nodeIndex: nil, position: nil)
                    resolve(convertedRoute)
                    self._sendEvent(name: "ProximiioMapbox.RouteEvent", body: convertedRoute)
                } else {
                    reject("404", "Route Not Found", nil)
                    self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
                }
            }
        } catch ProximiioMapboxNativeError.destinationNotFound {
            reject("404", "Route Not Found", nil)
            self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("404", "Route Not Found", nil)
            self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
        } catch {
            reject("500", "Unknown Error", nil)
            self.routeEvent(eventType: .canceled, text: "Unknown Error", additionalText: nil, data: nil);
        }
    }

    @objc(routeFindAndPreview:resolve:reject:)
    func routeFindAndPreview(configuration: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        do {
            let config = try convertDictionaryToRouteConfiguration(data: configuration)
            instance.routeFindAndPreview(configuration: config) { route in
                self.lastRoute = route
                if (route != nil) {
                    let convertedRoute = self._convertRoute(route: route, nodeIndex: nil, position: nil)
                    resolve(convertedRoute)
                    self._sendEvent(name: "ProximiioMapbox.RouteEvent", body: convertedRoute)
                } else {
                    reject("404", "Route Not Found", nil)
                    self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
                }
            }
        } catch ProximiioMapboxNativeError.destinationNotFound {
            reject("404", "Route Not Found", nil)
            self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("404", "Route Not Found", nil)
            self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
        } catch {
            reject("500", "Unknown Error", nil)
            self.routeEvent(eventType: .canceled, text: "Unknown Error", additionalText: nil, data: nil);
        }
    }

    @objc(routeFindAndStart:resolve:reject:)
    func routeFindAndStart(configuration: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        do {
            let config = try convertDictionaryToRouteConfiguration(data: configuration)
            instance.routeFindAndStart(configuration: config) { route in
                self.lastRoute = route
                if (route != nil) {
                    let convertedRoute = self._convertRoute(route: route, nodeIndex: nil, position: nil)
                    resolve(convertedRoute)
                    self._sendEvent(name: "ProximiioMapbox.RouteEvent", body: convertedRoute)
                } else {
                    reject("404", "Route Not Found", nil)
                    self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
                }
            }
        } catch ProximiioMapboxNativeError.destinationNotFound {
            reject("404", "Route Not Found", nil)
            self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
        } catch ProximiioMapboxNativeError.destinationNotSpecified {
            reject("404", "Route Not Found", nil)
            self.routeEvent(eventType: .routeNotfound, text: "Route Not Found", additionalText: nil, data: nil);
        } catch {
            reject("500", "Unknown Error", nil)
            self.routeEvent(eventType: .canceled, text: "Unknown Error", additionalText: nil, data: nil);
        }
    }

    @objc(routeStart:reject:)
    func routeStart(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        instance.routeStart()
        resolve(true)
    }

    @objc(routeCancel:reject:)
    func routeCancel(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) -> Void {
        instance.routeCancel(silent: false)
        resolve(true)
    }

    @objc(setStepImmediateThreshold:)
    func setStepImmediateThreshold(thresholdInMeters: NSNumber) -> Void {
        instance.navigation?.setStepImmediateThreshold(inMeters: thresholdInMeters.doubleValue)
    }

    @objc(setStepPreparationThreshold:)
    func setStepPreparationThreshold(thresholdInMeters: NSNumber) -> Void {
        instance.navigation?.setStepPreparationThreshold(inMeters: thresholdInMeters.doubleValue)
    }

    @objc(setRouteFinishThreshold:)
    func setRouteFinishThreshold(thresholdInMeters: NSNumber) -> Void {
        instance.navigation?.setRouteFinishThreshold(inMeters: thresholdInMeters.doubleValue)
    }

    @objc(setRerouteEnabled:)
    func setRerouteEnabled(enabled: NSNumber) -> Void {
        instance.navigation?.setReRouting(automatic: enabled.boolValue)
    }

    @objc(setReRouteThreshold:)
    func setReRouteThreshold(thresholdInMeters: NSNumber) -> Void {
        instance.navigation?.setReRouting(inMeters: thresholdInMeters.doubleValue)
    }

    // TTS

    @objc(ttsEnable:reject:)
    func ttsEnable(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        instance.navigation?.ttsEnable(enable: true)
        resolve(true)
    }

    @objc(ttsDisable)
    func ttsDisable() -> Void {
        instance.navigation?.ttsEnable(enable: false)
    }

    @objc(ttsHeadingCorrectionEnabled:)
    func ttsHeadingCorrectionEnabled(enabled: NSNumber) -> Void {
        instance.navigation?.ttsHeadingCorrection(enabled: enabled.boolValue)
    }

    @objc(ttsHeadingCorrectionThresholds:thresholdDegrees:)
    func ttsHeadingCorrectionThresholds(_ thresholdInMeters: NSNumber, thresholdDegrees: NSNumber) -> Void {
        instance.navigation?.ttsHeadingCorrectionThreshold(meters: thresholdInMeters.doubleValue,
                                                           degrees: thresholdDegrees.doubleValue)
    }

    @objc(ttsReassuranceInstructionEnabled:)
    func ttsReassuranceInstructionEnabled(enabled: NSNumber) -> Void {
        instance.navigation?.ttsReassuranceInstruction(enabled: enabled.boolValue)
    }

    @objc(ttsReassuranceInstructionDistance:)
    func ttsReassuranceInstructionDistance(distance: NSNumber) -> Void {
        instance.navigation?.ttsReassuranceInstruction(distance: distance.doubleValue)
    }

    @objc(ttsRepeatLastInstruction)
    func ttsRepeatLastInstruction() -> Void {
        instance.navigation?.ttsRepeatLastInstruction()
    }

    @objc(ttsHazardAlert:metadataKeys:)
    func ttsHazardAlert(enabled: NSNumber, metadataKeys: NSArray) -> Void {
        instance.navigation?.ttsHazardAlert(enabled: enabled.boolValue,
                                            metadataKeys: metadataKeys.map({($0 as! NSNumber).intValue}))
    }

    @objc(ttsSegmentAlert:exitEnabled:metadataKeys:)
    func ttsSegmentAlert(enterEnabled: NSNumber, exitEnabled: NSNumber, metadataKeys: NSArray) -> Void {
        instance.navigation?.ttsSegmentAlert(enterEnabled: enterEnabled.boolValue,
                                             exitEnabled: exitEnabled.boolValue,
                                             metadataKeys: metadataKeys.map({($0 as! NSNumber).intValue}))
    }

    @objc(ttsDecisionAlert:metadataKeys:)
    func ttsDecisionAlert(enabled: NSNumber, metadataKeys: NSArray) -> Void {
        instance.navigation?.ttsDecisionAlert(enabled: enabled.boolValue,
                                              metadataKeys: metadataKeys.map({($0 as! NSNumber).intValue}))
    }

    @objc(ttsLandmarkAlert:metadataKeys:)
    func ttsLandmarkAlert(enabled: NSNumber, metadataKeys: NSArray) -> Void {
        instance.navigation?.ttsLandmarkAlert(enabled: enabled.boolValue,
                                              metadataKeys: metadataKeys.map({($0 as! NSNumber).intValue}))
    }

    @objc(ttsLevelChangerMetadataKeys:)
    func ttsLevelChangerMetadataKeys(metadataKeys: NSArray) -> Void {
        instance.navigation?.ttsLevelChangerMetadataKeys(metadataKeys: metadataKeys.map({($0 as! NSNumber).intValue}))
    }

    @objc(setUserLocationToRouteSnappingEnabled:)
    func setUserLocationToRouteSnappingEnabled(_enabled: NSNumber) -> Void {
        let enabled = _enabled.boolValue;
        if (enabled) {
            if (snapEnabled) {
                return
            }

            ProximiioLocationManager.shared().addProcessor(snap, avoidDuplicates: true)
            snapEnabled = true
        } else {
            if (!snapEnabled) {
                return
            }

            // TODO remove the snap processor
        }
    }

    @objc(setUserLocationToRouteSnappingThreshold:)
    func setUserLocationToRouteSnappingThreshold(threshold: NSNumber) -> Void {
        snap.threshold = threshold.doubleValue
    }

    @objc(ttsDestinationMetadataKeys:)
    func ttsDestinationMetadataKeys(metadataKeys: NSArray) -> Void {
        // TODO
    }

    @objc(setLevelOverrideMap:)
    func setLevelOverrideMap(overrideMap: NSDictionary) -> Void {
        var local = [Int: String]();
        for key: NSNumber in overrideMap.allKeys as! [NSNumber] {
            local[key.intValue] = overrideMap[key] as? String
        }
        instance.levelNameMapper = local;
    }

    @objc(setUnitConversion:)
    func setUnitConversion(unitConversion: NSDictionary) -> Void {
        let unitConversion = convertDictionaryToPIOUnitConversion(data: unitConversion)
        instance.navigation?.setUnitConversion(conversion: unitConversion)
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

        guard let route = route else { return NSDictionary() }

        let routeMap = self.convertPIORouteToDictionary(route: route)
        let features = NSMutableArray()

        if let nodeIndex = nodeIndex, let position = position  {
            let remaining = route.lineStringFrom(startNodeIndex: nodeIndex,
                                                  firstPoint: position)

            remaining.forEach({ feature in
                feature.identifier = "route-node-remaining-\(remaining.firstIndex(of: feature) ?? 0)"
                features.add(feature.toDictionary())
            })

            let completed = route.lineStringUntil(endNodeIndex: nodeIndex,
                                                   lastPoint: position)

            completed.forEach({ feature in
                feature.identifier = "route-node-completed-\(completed.firstIndex(of: feature) ?? 0)"
                feature.properties["completed"] = true
                features.add(feature.toDictionary())
            })
        } else {
            let list = route.getLineStringFeatureList()
            list.forEach({ feature in
                feature.identifier = "route-node-\(list.firstIndex(of: feature) ?? 0)"
                features.add(feature.toDictionary())
            })
        }

        routeMap["features"] = features
        return routeMap
    }

    private func _synchronize(initial: Bool, completion: @escaping (Bool) -> ()) -> Void {
        self.updateSyncStatus(initial ? "INITIAL_RUNNING" : "UPDATE_RUNNING")
        Proximiio.sharedInstance().sync { completed in
            if (completed) {
                self.amenitiesCache = self.instance.database.amenities().map { self.convertAmenityToDictionary($0) }
                self.amenitiesChanged()
                self.featuresCache = self.instance.database.features().map { $0.toDictionary() as NSDictionary }
                self.updateSyncStatus(initial ? "INITIAL_FINISHED" : "UPDATE_FINISHED")
                self.featuresChanged()
                completion(true)
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
            "title": amenity.title as String
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
                "geometry": [
                    "type": "Point",
                    "coordinates": [ _data[1], _data[0] ]
                ],
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

    private func convertDictionaryToPIOUnitConversion(data: NSDictionary) -> PIOUnitConversion {
        let stageList: [NSDictionary] = data["stageList"] as! [NSDictionary]
        let stages = stageList.map({ _stage in
            let stage = _stage as NSDictionary
            return PIOUnitConversion.UnitStage(unitName: stage["unitName"] as! String,
                                               unitConversionToMeters: (stage["unitConversionToMeters"] as! NSNumber).doubleValue,
                                               minValueInMeters: (stage["minValueInMeters"] as! NSNumber).doubleValue,
                                               decimals: (stage["decimalPoints"] as! NSNumber).intValue)
        } as (NSDictionary) -> PIOUnitConversion.UnitStage)
        return PIOUnitConversion(stageList: stages)
    }

    private func _convertStepDirection(step: PIOGuidanceDirection) -> String {
        var stepDirection = "NONE"

        switch step {
            case .downElevator: stepDirection = "DOWN_ELEVATOR"
            case .downStairs: stepDirection = "DOWN_STAIRS"
            case .downEscalator: stepDirection = "DOWN_ESCALATOR"
            case .exitElevator: stepDirection = "EXIT_ELEVATOR"
            case .exitStairs: stepDirection = "EXIT_STAIRS"
            case .exitEscalator: stepDirection = "EXIT_ESCALATOR"
            case .finish: stepDirection = "FINISH"
            case .leftHard: stepDirection = "HARD_LEFT"
            case .leftNormal: stepDirection = "LEFT"
            case .leftSlight: stepDirection = "SLIGHT_LEFT"
            case .none: stepDirection = "NONE"
            case .rightHard: stepDirection = "HARD_RIGHT"
            case .rightNormal: stepDirection = "RIGHT"
            case .rightSlight: stepDirection = "SLIGHT_RIGHT"
            case .start: stepDirection = "START"
            case .straight: stepDirection = "STRAIGHT"
            case .turnAround: stepDirection = "TURN_AROUND"
            case .upElevator: stepDirection = "UP_ELEVATOR"
            case .upEscalator: stepDirection = "UP_ESCALATOR"
            case .upStairs: stepDirection = "UP_STAIRS"
        }

        return stepDirection
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
            self.sendEvent(withName: name, body: body)
        }
    }

    func onRoute(route: PIORoute?) {
        lastRoute = route;
    }

    func routeEvent(eventType type: PIORouteUpdateType, text: String, additionalText: String?, data: PIORouteUpdateData?) {
        var eventType = "UNKNOWN"

        switch type {
            case .calculating: eventType = "CALCULATING"
            case .canceled: eventType = "CANCELED"
            case .finished: eventType = "FINISHED"
            case .immediate: eventType = "DIRECTION_IMMEDIATE"
            case .new: eventType = "DIRECTION_NEW"
            case .osrmNetworkError: eventType = "ROUTE_OSRM_NETWORK_ERROR"
            case .recalculating: eventType = "RECALCULATING"
            case .routeNotfound: eventType = "ROUTE_NOT_FOUND"
            case .soon: eventType = "DIRECTION_SOON"
            case .update: eventType = "DIRECTION_UPDATE"
        }

        let body = NSMutableDictionary(dictionary: [
            "eventType": eventType,
            "text": text,
            "additionalText": additionalText ?? ""
        ])

        var _data = NSDictionary()

        if (type == .canceled) {
            body["data"] = _data
            _sendEvent(name: "ProximiioMapbox.RouteEventUpdate", body: body)
            return
        }

        if (data != nil) {
            _data = NSDictionary(dictionary: [
                "nodeIndex": data!.nodeIndex,
                "stepBearing": data!.stepBearing,
                "stepDirection": _convertStepDirection(step: data!.stepDirection),
                "stepDistance": data!.stepDistance,
                "stepDistanceTotal": data!.stepDistanceTotal,
                "nextStepDistance": data!.nextStepDistance ?? NSNumber(0),
                "nextStepDirection": _convertStepDirection(step: data!.nextStepDirection),
                "position": [
                    "latitude": data!.position.latitude,
                    "longitude": data!.position.longitude
                ],
                "pathLengthRemaining": data!.pathLengthRemaining
            ])
        }

        body["data"] = _data
        body["route"] = _convertRoute(route: lastRoute, nodeIndex: data?.nodeIndex, position: data?.position)
        _sendEvent(name: "ProximiioMapbox.RouteEventUpdate", body: body)
    }


    func onLandmarkEntered(_ landmarks: [PIOLandmark]) {
        // TODO - Convert Landmarks to something sane
        let data = NSDictionary(dictionary: [
            "type": "enter",
            "landmarks": NSArray()
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationLandmark", body: data)
    }


    func onLandmarkExit(_ landmarks: [ProximiioGeoJSON]) {
        // TODO - Convert Landmarks to something sane
        let data = NSDictionary(dictionary: [
            "type": "exit",
            "landmarks": NSArray()
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationLandmark", body: data)
    }

    func onHazardEntered(_ hazard: ProximiioGeoJSON) {
        let data = NSDictionary(dictionary: [
            "type": "enter",
            "hazard": convertProximiioGeoJSONtoDictionary(hazard)
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationHazard", body: data)
    }

    func onHazardExit(_ hazard: ProximiioGeoJSON) {
        let data = NSDictionary(dictionary: [
            "type": "exit",
            "hazard": convertProximiioGeoJSONtoDictionary(hazard)
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationHazard", body: data)
    }

    func onSegmentEntered(_ segment: ProximiioGeoJSON) {
        let data = NSDictionary(dictionary: [
            "type": "enter",
            "segment": convertProximiioGeoJSONtoDictionary(segment)
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationSegment", body: data)
    }

    func onSegmentExit(_ segment: ProximiioGeoJSON) {
        let data = NSDictionary(dictionary: [
            "type": "exit",
            "segment": convertProximiioGeoJSONtoDictionary(segment)
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationSegment", body: data)
    }

    func onDecisionEntered(_ decision: ProximiioGeoJSON) {
        let data = NSDictionary(dictionary: [
            "type": "enter",
            "decision": convertProximiioGeoJSONtoDictionary(decision)
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationDecision", body: data)
    }

    func onDecisionExit(_ decision: ProximiioGeoJSON) {
        let data = NSDictionary(dictionary: [
            "type": "exit",
            "decision": convertProximiioGeoJSONtoDictionary(decision)
        ])
        _sendEvent(name: "ProximiioMapboxOnNavigationDecision", body: data)
    }

    func onPositionUpdate(_ position: CLLocationCoordinate2D) {
        // dummy delegate method, functinality replaced by compass-heading rn module
    }

    func onHeadingUpdate(_ heading: Double) {
        // dummy
    }

    func onTTS() {
        // dummy
    }

    func onTTSDirection(text: String?) {
        // dummy
    }
}
