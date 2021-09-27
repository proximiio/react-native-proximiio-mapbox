---
title: API Reference

language_tabs:
  - objc

toc_footers:
  - <a href='https://proximi.io/'>Proximi.io Website</a>

search: true
---

# Introduction

Welcome to the Proximi.io React Native Mapbox Library, this library provides indoor positioning support for both IOS and Android Mapbox implementations. 

# Version

Current public version is: `5.1.3`

# Installation

Installation is managed by npm, the library provides autolinking methods to simplify the platform integration.

Run the following inside the project folder to install the library:

```bash
npm install https://github.com/proximiio/react-native-proximiio-mapbox
```

After the installation is finished, enter the ios directory and run pod install

```bash
cd ios
pod install
```

For android make sure to set minSdk to 24 in build.gradle

# Usage

## General

The library needs to be authenticated at first, in your application you should call the authorize method, once per app start, ideally in componentDidMount method or inside useEffect(() => {}, []) if you prefer functional components. After authorization is successfuly finished, you can subscribe to various events or fetch data from Proximi.io Mapbox SDK.

This repository contains also an example application showcasing the implementation in simple form.

## Quick Sample usage

```ts
import * as React from 'react';
import MapboxGL from "@react-native-mapbox-gl/maps";

import Proximiio, {
  ProximiioContextProvider, ProximiioEvents, ProximiioLocation
} from 'react-native-proximiio';

import ProximiioMapbox, { UserLocationSource, AmenitySource, GeoJSONSource, RoutingSource } from '../../src/index';
import { Text, Button, View } from 'react-native';

const TOKEN = 'INSERT-YOUR-PROXIMIIO-TOKEN-HERE'

MapboxGL.setAccessToken('optional-your-mapbox-token-here')

interface Props {

}

interface State {
  coordinates: number[],
  mapLoaded: boolean,
  mapLevel: number,
  proximiioReady: boolean
}

export default class App extends React.Component<Props, State> {
  _map : MapboxGL.MapView | null = null
  _camera: MapboxGL.Camera | null = null

  state = {
    coordinates: [ 25.22717761, 55.32300908 ],
    mapLoaded: false,
    mapLevel: 0,
    proximiioReady: false
  }

  componentDidMount() {
    this.initProximiio()
  }

  async initProximiio() {
    await Proximiio.authorize(TOKEN)
    await ProximiioMapbox.authorize(TOKEN)
    Proximiio.requestPermissions()

    Proximiio.subscribe(ProximiioEvents.PositionUpdated, (location: ProximiioLocation) => {
      this._camera?.setCamera({
        centerCoordinate: [location.lng, location.lat],
        animationDuration: 2000,
      })
    });

    this.setState({ proximiioReady: true })
  }

  render() {
    if (!this.state.proximiioReady ) {
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    }

    return (<React.Fragment>
      <View style={{flex: 1}}>
        <MapboxGL.MapView
          logoEnabled={false}
          ref={(map: MapboxGL.MapView) => (this._map = map)}
          style={{flex: 1}}
          styleURL={ProximiioMapbox.styleURL}
          compassEnabled={false}
          onDidFinishLoadingMap={this.onMapLoaded}>
          <MapboxGL.Camera
            ref={(camera: MapboxGL.Camera) => {
              this._camera = camera;
            }}
            zoomLevel={this.props.zoom}
            minZoomLevel={settings.map.minZoom}
            maxZoomLevel={settings.map.maxZoom}
            centerCoordinate={this.props.centerCoordinate}
            defaultSettings={{
              centerCoordinate: settings.map.coordinates,
              heading: settings.map.heading,
              pitch: settings.map.pitch,
              zoomLevel: settings.map.zoom,
            }}
          />
          <MapboxGL.Images images={images} />

          {this.state.mapLoaded && (
            <ProximiioContextProvider>
              <AmenitySource />
              <GeoJSONSource level={this.props.level} onPress={this.onPress} />
              <RoutingSource level={this.props.level} />
              <UserLocationSource visible={true} showHeadingIndicator={true} />
            </ProximiioContextProvider> 
          )}
        </MapboxGL.MapView>
      </View>
    </React.Fragment>)
  }
}

const styles = StyleSheet.create({
  buttons: {
    position: 'absolute', 
    zIndex: 100, 
    right: 20, 
    top: 100, 
    width: 150, 
    height: 140, 
    backgroundColor: 'white'
  },
});
```

## Available MapBox Sources

### AmenitySource
this compoment provides Proximi.io amenities support (icons), its required to include this source
to automatically manage images for POIs and other GeoJSON points

### GeoJSONSource
provides Proximi.io GeoJSON data and styling

```ts
GeoJSONSourceProps {
  level: number // filters features for level that is shown on map
  filter?: (Feature: Feature) => boolean // filter features using custom filter function
  onPress?: (features: Feature[]) => void; // tap action trigger for geojson data, see note
  ignoreLayers?: string[] // optional array of layer ids to set invisible
}
```
note: onPress action features attribute contains all features at the coordinates where the tap action occured, those should be further filtered based on your usecase, eg. const points = features.filter((f) => f.isPoi);

### RoutingSource
provides Proximi.io Routing data & styling

```ts
RoutingSourceProps {
  level: number // filters features for level that is shown on map
  showSymbols?: boolean // enables start & target symbols visibility on top of routing line
  startImage?: string // custom image - see note below
  targetImage?: string // custom image - see note below
  directionImage?: string // custom image repeated on top of routing line- see note below
  symbolLayerStyle?: SymbolLayerStyle (https://github.com/react-native-mapbox-gl/maps/blob/master/docs/SymbolLayer.md)
  lineSymbolLayerStyle?: SymbolLayerStyle (https://github.com/react-native-mapbox-gl/maps/blob/master/docs/SymbolLayer.md)
  aboveLayerID?: string // places routing layers above specified layer
  dotted?: boolean // use dotted symbol routing line 
  dottedLineStyle?: SymbolLayerStyle // custom styling for dotted line symbol
  completedStyle?: LineLayerStyle // custom styling for completed part of route
  remainingStyle?: LineLayerStyle // custom styling for remaining part of route
}

```
note: Image should be represented by amenity id or the reference name of the image loaded via MapboxGL.Images (https://github.com/react-native-mapbox-gl/maps/blob/master/docs/Images.md)

example with require images from project folder:
```
const images = {
  routeStart: require('./assets/icons8-marker-a-50.png'),
  routeTarget: require('./assets/icons8-marker-b-50.png'),
  routeDirection: require('./assets/direction.png')
};

// routeStart, routeTarget, routeDirection are the reference image names in this case

...inside <MapboxGL.Camera> object...
<MapboxGL.Images images={images}/>
```


### UserLocationSource
provides user location point and accuracy circle

```ts
UserLocationSourceProps {
  level: number // filters features for level that is shown on map
  onAccuracyChanged?: (accuracy: number) => void; // optional callback called on accuracy change
  onHeadingChanged?: (heading: number) => void;  // optional callback called on heading change
  headingStyle?: SymbolLayerStyle // optional custom styling for heading symbol
  markerOuterRingStyle?: CircleLayerStyle // optional custom styling for marker outer ring
  markerMiddleRingStyle?: CircleLayerStyle // optional custom styling for marker middle ring
  markerInnerRingStyle?: CircleLayerStyle // optional custom styling for marker inner ring
  showHeadingIndicator?: boolean // heading indicator toggle
  visible?: boolean // user location layers visibility toggle
}
```

## Methods & Properties

### ProximiioMapbox.authorize(token: string): void
authorizes Proximi.io Mapbox SDK, also enables styleURL property

### ProximiioMapbox.styleURL: string
provides authorized url for Proximi.io Mapbox Style

### ProximiioMapbox.isReady: boolean
returns loaded state of the Proximi.io Mapbox library

### ProximiioMapbox.getAmenities(): Promise<ProximiioAmenity[]>
returns all available amenity objects

### ProximiioMapbox.getFeatures(): Promise<ProximiioFeature[]>
returns all available feature objects

## Routing
Our RoutingSource minimizes the effort to implement the routing in your application. Depending on your usecase,
you can call one of the route.find methods and after the user is finished with the navigation, call the routeCancel method.

Basic building block of routing is the configuration object that you pass to route methods:
```ts
type ProximiioRouteConfiguration = {
  startFeatureId?: String; // optional feature id as route starting point
  startLatLonLevel?: Number[]; // optional starting point specified by latitude, longitude and level values
  destinationFeatureId?: String; // optional feature id as route destination point
  destinationLatLonLevel?: Number[]; // optional destination point specified by latitude, longitude and level values
  destinationTitle?: String | undefined; // optional title for route destination
  waypointFeatureIdList?: String[][]; // array of waypoints specified by feature ids
  wayfindingOptions?: ProximiioWayfindingOptions; // optional wayfinding options object
}

type ProximiioWayfindingOptions = {
  avoidBarriers?: boolean;
  avoidElevators?: boolean;
  avoidEscalators?: boolean;
  avoidNarrowPaths?: boolean;
  avoidRamps?: boolean;
  avoidRevolvingDoors?: boolean;
  avoidStaircases?: boolean;
  avoidTicketGates?: boolean;
  pathFixDistance?: number;
}

```
If "startFeatureId" or "startLatLonLevel" are not specified, last known user position will be used as starting point.
Either "destinationFeatureId" or "destinationLatLonLevel" must be specified.
"wayfindingOptions" default to false for all boolean values and 1.0 for pathFixDistance.

### ProximiioMapbox.route.calculate(routeConfigation: ProximiioRouteConfiguration): Promise<ProxmiioRoute>
Use this method to calculate route info, useful for feature lists showing distance or travel time.

### ProximiioMapbox.route.find(routeConfiguration: ProximiioRouteConfiguration)
Find route to navigate on, but do not start navigation or preview on map.

```ts
ProximiioMapbox.route.find(routeConfiguration)
```

### ProximiioMapbox.route.findAndPreview(routeConfiguration: ProximiioRouteConfiguration)
Find route to navigate on, but do not start navigation, only preview it on map.

```ts
ProximiioMapbox.route.findAndPreview(routeConfiguration)
```

### ProximiioMapbox.route.findAndPreview(routeConfiguration: ProximiioRouteConfiguration)
Find route to navigate on, and immediately start navigation.

```ts
ProximiioMapbox.route.findAndStart(routeConfiguration)
```


### ProximiioMapbox.route.preview
Preview route on map. Returns true if route preview was enabled.

```ts
ProximiioMapbox.route.preview()
```

### ProximiioMapbox.route.start
Start prepared route (if one of the routeFind* methods was called before and route was successfully found).

```ts
ProximiioMapbox.route.start()
```

### ProximiioMapbox.route.cancel
Stops current navigation, or route preview (removes the path from map).

```ts
ProximiioMapbox.route.cancel()
```

## Other methods

### ProximiioMapbox.setUnitConversion(unit: string, conversionCoefficient: number): void
configure unit that should be used for guidance (please make sure you have defined this unit in guidance translations in editor)

### ProximiioMapbox.setStepImmediateThreshold(thresholdInMeters: number): void
set distance before a change in direction when the instruction should be considered 'immediate'

### ProximiioMapbox.setStepPreparationThreshold(thresholdInMeters: number): void
set distance before a change in direction when the instruction should be considered comming 'soon' and possibly warn the user about upcoming event

### ProximiioMapbox.setRouteFinishThreshold(thresholdInMeters: number): void
set a threshold which regulates how far from a destination user must be to be considered he arrived,

### ProximiioMapbox.setRerouteEnabled(enabled: boolean): void
enable rerouting if the user strays from path

### ProximiioMapbox.setReRouteThreshold(thresholdInMeters: number): void
configure threshold when the user is considered strayed from path

### ProximiioMapbox.setUserLocationToRouteSnappingEnabled(enabled: boolean): void
toggle snapping the user's location on map to the current route

### ProximiioMapbox.setUserLocationToRouteSnappingThreshold((threshold: number): void {
sets route snapping threshold value (in meters)

### ProximiioMapbox.ttsEnabled(enable: boolean): void
toggles TTS

### ttsHeadingCorrectionEnabled(enabled: boolean): void
Enable heading correction warnings. This will enable two spoken warnings - tell user starting orientation of route, and when the user is walking the wrong way.

### ttsHeadingCorrectionThresholds(thresholdDistanceMeters: number, thresholdDegrees: number): void
Set thresholds to determine when is the heading correction triggered.
thresholdMeters distance from route to trigger correction. Default 3 meters.
thresholdDegrees degrees between current heading and heading towards correct route. Default 90 degrees.

### ttsReassuranceInstructionEnabled(enabled: boolean): void
Enable reassurance instructions (meaning TTS will speak even if there is not a direction change to keep user confidence about current direction) using ttsReassuranceInstructionEnabled(boolean enabled) and configure distance between reassurance updates with ttsReassuranceInstructionDistance(double distanceInMeters)

### ttsReassuranceInstructionDistance(distance: Number): void
Sets distance by which reassurance instruction is triggered

### ttsRepeatLastInstruction(): void
Repeat last instruction

### ttsHazardAlert(enabled: boolean): void
Toggle spoken information about hazards

### ttsSegmentAlert(enabled: boolean): void
Toggle spoken information about segments

### ttsDecisionAlert(enabled: boolean): void
Toggle spoken information about decision points

### ttsLandmarkAlert(enabled: boolean): void
Toggle spoken information about landmarks

## Events

### ProximiioMapboxEvents.READY
called after the Proximi.io Mapbox finishes the authorization & data initialization

### ProximiioMapboxEvents.FAILURE
called if the Proximi.io Mapbox authorization or data initialization fails

### ProximiioMapboxEvents.ROUTE_STARTED
called after the route is started, provides ProximiioRoute object

```ts
Proximiio.subscribe(
  ProximiioMapboxEvents.ROUTE_STARTED,
  (route: ProximiioRoute) => console.log(`route features: ${route.features}`)
);
```

### ProximiioMapboxEvents.ROUTE_CANCELED
called after the route was canceled

```ts
Proximiio.subscribe(
  ProximiioMapboxEvents.ROUTE_CANCELED,
  () => console.log(`route canceled`)
);
```

### ProximiioMapboxEvents.ROUTE_UPDATED
called when the route is updated, use this method to provide navigation instructions to the user, available as route.text property

```ts
Proximiio.subscribe(
  ProximiioMapboxEvents.ROUTE_UPDATED,
  (routeUpdate: ProximiioMapboxRouteUpdateEvent) => console.log(`route updated`)
);
```

### ProximiioMapboxEvents.ON_LANDMARK
called when user is passing landmark, provides Landmark GeoJSON Features

```ts
Proximiio.subscribe(
  ProximiioMapboxEvents.ON_LANDMARK,
  (landmarks: ProximiioFeature[]) => console.log(`passing landmarks: ${landmarks}`)
);
```


### ProximiioMapboxEvents.ON_HAZARD
called when user is passing a hazard, provides hazard GeoJSON Feature

```ts
Proximiio.subscribe(
  ProximiioMapboxEvents.ON_HAZARD,
  (hazard: ProximiioFeature) => console.log(`passing hazard: ${hazard}`)
);
```

### ProximiioMapboxEvents.ON_SEGMENT
called when user is passing a segment, provides segment GeoJSON Feature

```ts
Proximiio.subscribe(
  ProximiioMapboxEvents.ON_SEGMENT,
  (segment: ProximiioFeature) => console.log(`passing segment: ${segment}`)
);
```

### ProximiioMapboxEvents.ON_DECISION
called when user is passing a decision point, provides decision point GeoJSON Feature

```ts
Proximiio.subscribe(
  ProximiioMapboxEvents.ON_DECISION,
  (decisionPoint: ProximiioFeature) => console.log(`passing hazard: ${decisionPoint}`)
);
```
