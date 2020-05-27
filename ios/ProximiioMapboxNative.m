#import "ProximiioMapboxNative.h"
@import UIKit;
@import Proximiio;
@import ProximiioMapbox;

@implementation ProximiioMapboxNative {
    bool hasListeners;
    bool ready;
    ProximiioMapbox *instance;
    PIORoute *route;
}

- (void)startObserving {
    hasListeners = true;
}

- (void)stopObserving {
    hasListeners = false;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
      @"ProximiioMapboxInitialized",
      @"ProximiioMapboxFailed",
      @"ProximiioMapboxRouteStarted",
      @"ProximiioMapboxRouteCanceled",
      @"ProximiioMapboxRouteUpdated",
      @"ProximiioMapboxOnNavigationLandmark",
      @"ProximiioMapboxOnNavigationHazard",
      @"ProximiioMapboxOnNavigationSegment",
      @"ProximiioMapboxOnNavigationDecision",
      @"ProximiioMapboxAmenitiesChanged",
      @"ProximiioMapboxFeaturesChanged",
      @"ProximiioMapboxStyleChanged",
    ];
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(authorize:(NSString *)token authorizeWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    ProximiioMapboxConfiguration *config = [[ProximiioMapboxConfiguration alloc] initWithToken:token];
    instance = [[ProximiioMapbox alloc] initWithMapView:nil configuration:config];
//    instance = [[ProximiioMapbox alloc] initWithMapView:nil configuration:config apiVersion:@"v5"];

    [[Proximiio sharedInstance] syncAmenities:^(BOOL completed) {
        if (completed) {
            [[Proximiio sharedInstance] syncFeatures:^(BOOL completed) {
                if (completed) {
                    [self->instance initialize:^(enum ProximiioMapboxAuthorizationResult result) {
                        if (result == ProximiioMapboxAuthorizationResultSuccess) {
                            [self->instance routeCancelWithSilent:true];
                            self->instance.mapInteraction = self;
                            self->instance.mapNavigation = self;
                            self->ready = true;
                            resolve(@{@"ready": @true});
                        } else {
                            NSLog(@"Proximi.io auth results failed, rejecting");
                            reject(@"AUTH_FAILURE", @"Authorization Failed", nil);
                        }
                    }];
                }
            }];
        }
    }];
}

RCT_EXPORT_METHOD(isReadyWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@(ready));
}

RCT_EXPORT_METHOD(search:(NSString *) searchWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {

}

RCT_EXPORT_METHOD(getAmenityCategories:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    PIODatabase *db = PIODatabase.sharedInstance;
    resolve(db.amenities);
}

RCT_EXPORT_METHOD(getAmenities:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    PIODatabase *db = PIODatabase.sharedInstance;
    NSMutableArray *converted = [NSMutableArray array];
    for (ProximiioAmenity *amenity in db.amenities) {
        [converted addObject:[self convertAmenity:amenity]];
    }
    resolve(converted);
}

RCT_EXPORT_METHOD(getFeatures:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    PIODatabase *db = PIODatabase.sharedInstance;
    NSMutableArray *converted = [NSMutableArray array];
    for (ProximiioGeoJSON *feature in db.features) {
        [converted addObject:[self convertFeature:feature]];
    }
    resolve(converted);
}

RCT_EXPORT_METHOD(getStyle:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {

}

RCT_EXPORT_METHOD(getSyncStatus:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@true);
}

RCT_EXPORT_METHOD(updateLocation:(NSNumber * _Nonnull)latitude longitude:(NSNumber * _Nonnull)longitude updateLocationWithResolver:(RCTPromiseResolveBlock)resolve rejected:(RCTPromiseRejectBlock)reject) {
    ProximiioLocation *location = [ProximiioLocation locationWithLatitude:latitude.doubleValue longitude:longitude.doubleValue];
    [instance setUserLocation:location];
}

RCT_EXPORT_METHOD(updateFloor:(NSString *)uuid resolver:(RCTPromiseResolveBlock)resolve rejected:(RCTPromiseRejectBlock)reject) {
    ProximiioFloor *floor = [Proximiio.sharedInstance getFloor:uuid];
    if (floor != nil) {
        [instance setUserFloor:floor];
    }
}

RCT_EXPORT_METHOD(routeFind:(NSString *)poiId options:(NSDictionary *)routeOptions preview:(BOOL)preview start:(BOOL)start resolver:(RCTPromiseResolveBlock)resolve rejected:(RCTPromiseRejectBlock)reject) {
    ProximiioGeoJSON *feature;
    for (ProximiioGeoJSON *_feature in PIODatabase.sharedInstance.features) {
        if ([_feature.identifier isEqualToString:poiId]) {
            feature = _feature;
            break;
        }
    }
    
    if (feature != nil) {
        [instance routeFindFrom:instance.userLocation
                          level:instance.userFloor.floorNumber.intValue
                             to:feature
                        options:[self convertRouteOptions:routeOptions]
                   previewRoute:false
                     startRoute:true];
    }
}

//ProximiioMapboxNative.routeFindFrom(latFrom, lngFrom, levelFrom, latTo, lngTo, levelTo, title, this.routeOptions, preview, !preview);


RCT_EXPORT_METHOD(routeFindFrom:(nonnull NSNumber *)latFrom
                  lngFrom:(nonnull NSNumber *)lngFrom
                  levelFrom:(nonnull NSNumber *)levelFrom
                  latTo:(nonnull NSNumber *)latTo
                  lngTo:(nonnull NSNumber *)lngTo
                  levelTo: (nonnull NSNumber *)levelTo
                  title:(NSString *)title
                  options:(nonnull NSDictionary *)routeOptions
                  preview:(BOOL)preview
                  start:(BOOL)start
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejected:(RCTPromiseRejectBlock)reject) {
    CLLocation *locationFrom = [[CLLocation alloc] initWithLatitude:latFrom.doubleValue longitude:lngFrom.doubleValue];
    ProximiioGeoJSON *geojsonTo = [ProximiioGeoJSON featureLineWithCoordinates:@[lngFrom, latFrom] properties:@{
        @"level": levelTo
    }];
    [instance routeFindFrom:locationFrom
                      level:levelFrom.intValue
                         to:geojsonTo
                    options:[self convertRouteOptions:routeOptions]
               previewRoute:preview
                 startRoute:start];
}

RCT_EXPORT_METHOD(routeFindBetween:(NSString *)fromId to:(NSString *)toId options:(NSDictionary *)routeOptions preview:(BOOL)preview start:(BOOL)start resolver:(RCTPromiseResolveBlock)resolve rejected:(RCTPromiseRejectBlock)reject) {
    ProximiioGeoJSON *feature;
    for (ProximiioGeoJSON *_feature in PIODatabase.sharedInstance.features) {
        if ([_feature.identifier isEqualToString:fromId]) {
            feature = _feature;
            break;
        }
    }
    
    ProximiioGeoJSON *featureTo;
    for (ProximiioGeoJSON *_feature in PIODatabase.sharedInstance.features) {
        if ([_feature.identifier isEqualToString:toId]) {
            featureTo = _feature;
            break;
        }
    }
    
    if (feature != nil) {
        [instance routeFindFrom:feature to:featureTo options:[self convertRouteOptions:routeOptions] previewRoute:preview startRoute:start];
    }
}

RCT_EXPORT_METHOD(routeCancel:(RCTPromiseResolveBlock)resolve rejected:(RCTPromiseRejectBlock)reject) {
    [instance routeCancelWithSilent:false];
}

-(void)changeWithFloor:(NSInteger)floor {
//    [instance setMapFloor:floor];
}

-(void)onRouteWithRoute:(PIORoute *)_route {
    NSMutableDictionary *event = [NSMutableDictionary dictionary];
    event[@"type"] = @"ROUTE_STARTED";
    event[@"descriptor"] = _route.summary;
    event[@"features"] = [self convertLinestringList:[_route getLineStringFeatureList]];
    NSMutableArray *nodes = [NSMutableArray array];
    for (PIORouteNode *_node in _route.nodeList) {
        NSMutableDictionary *node = [NSMutableDictionary dictionary];
        node[@"bearingFromLastNode"] = @(_node.bearingFromLastNode);
        node[@"coordinates"] = @[ @(_node.coordinates.coordinate.longitude), @(_node.coordinates.coordinate.latitude) ];
        node[@"direction"] = [self convertDirection:_node.direction];
        node[@"distanceFromLastNode"] = @(_node.distanceFromLastNode);
        node[@"level"] = @(_node.level);
        node[@"levelChangerId"] = _node.levelChangerId;
        node[@"text"] = _node.text;
        if (_node.lineStringFeatureTo != nil && _node.lineStringFeatureTo.geometry != nil) {
            node[@"lineStringFeatureTo"] = [self convertFeature:_node.lineStringFeatureTo];
        }
        [nodes addObject:node];
    }
    event[@"nodes"] = nodes;
    route = _route;
    [self _sendEventWithName:@"ProximiioMapboxRouteStarted" body:event];
}

-(void)onRequestReRoute {
}

- (void)onTapWithFeature:(ProximiioGeoJSON * _Nonnull)feature {
    // dummy delegate
}


-(void)onHazardEntered:(ProximiioGeoJSON *)hazard {
    NSDictionary *event = @{
        @"type": @"enter",
        @"hazard": [self convertFeature:hazard]
    };
    [self _sendEventWithName:@"ProximiioMapboxOnNavigationHazard" body:event];
}

-(void)onSegmentEntered:(ProximiioGeoJSON *)segment {
    NSDictionary *event = @{
        @"type": @"enter",
        @"segment": [self convertFeature:segment]
    };
    [self _sendEventWithName:@"ProximiioMapboxOnNavigationSegment" body:event];
}

-(void)onPositionUpdate:(CLLocationCoordinate2D)position {

}

-(void)onHeadingUpdate:(double)heading {

}

-(void)routeEventWithEventType:(enum PIORouteUpdateType)type text:(NSString *)text additionalText:(NSString *)additionalText data:(PIORouteUpdateData *)data {
    NSMutableDictionary *event = [NSMutableDictionary dictionary];
    if (text != nil) {
        event[@"text"] = text;
    }

    if (additionalText != nil) {
        event[@"additionalText"] = additionalText;
    }

    if (data != nil) {
        event[@"data"] = [self convertRouteUpdateData:data];
    }

    if (type == PIORouteUpdateTypeCanceled) {
        event[@"type"] = @"CANCELED";
        [self _sendEventWithName:@"ProximiioMapboxRouteCanceled" body:event];
    } else if (type == PIORouteUpdateTypeRouteNotfound) {
        event[@"type"] = @"ROUTE_NOT_FOUND";
        [self _sendEventWithName:@"ProximiioMapboxRouteUpdated" body:event];
    } else if (type == PIORouteUpdateTypeUpdate || type == PIORouteUpdateTypeImmediate) {
        event[@"type"] = @"ROUTE_UPDATE";
        [self _sendEventWithName:@"ProximiioMapboxRouteUpdated" body:event];
    }
}

- (void)onDecisionEntered:(ProximiioGeoJSON * _Nonnull)decision {
    [self sendEventWithName:@"ProximiioMapboxOnNavigationDecision"
                       body:@{
                           @"type": @"enter",
                           @"decision": [self convertFeature:decision]
                       }];
}


- (void)onLandmarkEntered:(NSArray<PIOLandmark *> * _Nonnull)landmarks {
    NSMutableArray *events = [NSMutableArray array];
    for (PIOLandmark *landmark in landmarks) {
//        [events addObject:[self convertFeature:lan]];
    }
    [self sendEventWithName:@"ProximiioMapboxOnNavigationDecision" body:events];
}


- (void)_sendEventWithName:(NSString *)event body:(id)body {
    if (hasListeners) {
        [self sendEventWithName:event body:body];
    }
}

- (NSString *)convertDirection:(PIOGuidanceDirection)direction {
    if (direction == PIOGuidanceDirectionNone) {
        return @"None";
    } else if (direction == PIOGuidanceDirectionStart) {
        return @"Start";
    } else if (direction == PIOGuidanceDirectionFinish) {
        return @"Finish";
    } else if (direction == PIOGuidanceDirectionStraight) {
        return @"Straight";
    } else if (direction == PIOGuidanceDirectionLeftHard) {
        return @"LeftHard";
    } else if (direction == PIOGuidanceDirectionLeftNormal) {
        return @"LeftNormal";
    } else if (direction == PIOGuidanceDirectionLeftSlight) {
        return @"LeftSlight";
    } else if (direction == PIOGuidanceDirectionRightHard) {
        return @"RightHard";
    } else if (direction == PIOGuidanceDirectionRightNormal) {
        return @"RightNormal";
    } else if (direction == PIOGuidanceDirectionRightSlight) {
        return @"RightSlight";
    } else if (direction == PIOGuidanceDirectionTurnAround) {
        return @"TurnAround";
    } else if (direction == PIOGuidanceDirectionUpElevator) {
        return @"UpElevator";
    } else if (direction == PIOGuidanceDirectionDownElevator) {
        return @"DownElevator";
    } else if (direction == PIOGuidanceDirectionUpEscalator) {
        return @"UpEscalator";
    } else if (direction == PIOGuidanceDirectionDownEscalator) {
        return @"DownEscalator";
    } else if (direction == PIOGuidanceDirectionUpStairs) {
        return @"UpStairs";
    } else if (direction == PIOGuidanceDirectionDownStairs) {
        return @"DownStairs";
    } else {
        return @"None";
    }
}

- (NSDictionary *)convertRouteUpdateData:(PIORouteUpdateData *)data {
    NSMutableDictionary *_route = [NSMutableDictionary dictionary];
    _route[@"nextStepBearing"] = data.nextStepBearing;
    _route[@"nextStepDirection"] = [self convertDirection:data.nextStepDirection];
    _route[@"nextStepDistance"] = data.nextStepDistance;
    _route[@"nodeIndex"] = @(data.nodeIndex);
    _route[@"pathLengthRemaining"] = @(data.pathLengthRemaining);
    _route[@"position"] = @[ @(data.position.longitude), @(data.position.longitude) ];
    _route[@"stepBearing"] = @(data.stepBearing);
    _route[@"stepDirection"] = [self convertDirection:data.stepDirection];
    _route[@"stepDistance"] = @(data.stepDistance);
    _route[@"stepHeading"] = data.stepHeading;
    _route[@"remaining"] = [self convertLinestringList:[route getLineStringListFromStart:data.nodeIndex point:data.position]];
    return _route;
}

- (NSArray *)convertLinestringList:(NSArray *)list {
    NSMutableArray *linestringList = [NSMutableArray array];
    for (ProximiioGeoJSON *geoJSON in list) {
        [linestringList addObject:[self convertFeature:geoJSON]];
    }
    return linestringList;
}

- (PIORouteOptions *)convertRouteOptions:(NSDictionary *)data {
    PIORouteOptions *options = [[PIORouteOptions alloc] init];
    options.avoidBarriers = data[@"avoidBarriers"];
    options.avoidElevators = data[@"avoidElevators"];
    options.avoidEscalators = data[@"avoidEscalators"];
    options.avoidNarrowPaths = data[@"avoidNarrowPaths"];
    options.avoidRamps = data[@"avoidRamps"];
    options.avoidRevolvingDoors = data[@"avoidRevolvingDoors"];
    options.avoidStairs = data[@"avoidStaircases"];
    options.avoidTicketGates = data[@"avoidTicketGates"];
    return options;
}

- (NSDictionary *)convertAmenity:(ProximiioAmenity *)amenity {
    return @{
      @"id": amenity.identifier,
      @"title": amenity.title,
      @"description": amenity.desc,
      @"icon": amenity.icon,
      @"category": amenity.category
    };
}

- (NSDictionary *)convertFeature:(ProximiioGeoJSON *)geoJSON {
    NSMutableDictionary *feature = [NSMutableDictionary dictionaryWithDictionary:@{
      @"type": geoJSON.type,
      @"geometry": geoJSON.geometry,
      @"properties": geoJSON.properties
    }];
    if (geoJSON.identifier != nil) {
        feature[@"id"] = geoJSON.identifier;
    }
    return feature;
}

@end
