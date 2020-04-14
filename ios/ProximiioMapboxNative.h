#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
@import ProximiioMapbox;

@interface ProximiioMapboxNative : RCTEventEmitter <RCTBridgeModule, ProximiioMapboxNavigation, ProximiioMapboxInteraction>

@end
