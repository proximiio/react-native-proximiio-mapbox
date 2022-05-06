#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ProximiioMapboxNative, RCTEventEmitter)
//@interface RCT_EXTERN_REMAP_MODULE("react-native-proximiio-mapbox", ProximiioMapboxNative, NSObject)

RCT_EXTERN_METHOD(authorize:(NSString *)token resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getAmenities:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getFeatures:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getSyncStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(synchronize:(NSString *)token resolve(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateLocation:(nonnull NSNumber *)latitude
                  longitude:(nonnull NSNumber *)longitude
                  sourceType:(NSString *)sourceType
                  accuracy:(nonnull NSNumber *)longitude
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(updateLevel:(nonnull NSNumber *)level resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(routeCalculate:(NSDictionary *)configuration
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(routeFind:(NSDictionary *)configuration
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(routeFindAndPreview:(NSDictionary *)configuration
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(routeFindAndStart:(NSDictionary *)configuration
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(routeStart:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(routeCancel:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setUnitConversion:(NSDictionary *)unitConversion)
RCT_EXTERN_METHOD(setStepImmediateThreshold:(nonnull NSNumber *)thresholdInMeters)
RCT_EXTERN_METHOD(setStepPreparationThreshold:(nonnull NSNumber *)thresholdInMeters)
RCT_EXTERN_METHOD(setRouteFinishThreshold:(nonnull NSNumber *)thresholdInMeters)
RCT_EXTERN_METHOD(setRerouteEnabled:(nonnull NSNumber *)enabled)
RCT_EXTERN_METHOD(setReRouteThreshold:(nonnull NSNumber *)thresholdInMeters)
RCT_EXTERN_METHOD(setLevelOverrideMap:(NSDictionary *)overrideMap)

RCT_EXTERN_METHOD(ttsEnable:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(ttsDisable)
RCT_EXTERN_METHOD(ttsHeadingCorrectionEnabled:(nonnull NSNumber *)enabled)
RCT_EXTERN_METHOD(ttsHeadingCorrectionThresholds:(nonnull NSNumber *)thresholdInMeters thresholdDegrees:(nonnull NSNumber *)thresholdDegrees)
RCT_EXTERN_METHOD(ttsReassuranceInstructionEnabled:(nonnull NSNumber *)enabled)
RCT_EXTERN_METHOD(ttsReassuranceInstructionDistance:(nonnull NSNumber *)distance)
RCT_EXTERN_METHOD(ttsRepeatLastInstruction)
RCT_EXTERN_METHOD(ttsHazardAlert:(nonnull NSNumber *)enabled metadataKeys:(NSArray *)metadataKeys)
RCT_EXTERN_METHOD(ttsSegmentAlert:(nonnull NSNumber *)enterEnabled exitEnabled:(nonnull NSNumber *)exitEnabled metadataKeys:(NSArray *)metadataKeys)
RCT_EXTERN_METHOD(ttsDecisionAlert:(nonnull NSNumber *)enabled metadataKeys:(NSArray *)metadataKeys)
RCT_EXTERN_METHOD(ttsLandmarkAlert:(nonnull NSNumber *)enabled metadataKeys:(NSArray *)metadataKeys)
RCT_EXTERN_METHOD(setUserLocationToRouteSnappingEnabled:(nonnull NSNumber *)enabled)
RCT_EXTERN_METHOD(setUserLocationToRouteSnappingThreshold:(nonnull NSNumber *)threshold)
RCT_EXTERN_METHOD(ttsLevelChangerMetadataKeys:(NSArray *)metadataKeys)
RCT_EXTERN_METHOD(ttsDestinationMetadataKeys:(NSArray *)metadataKeys)

@end
