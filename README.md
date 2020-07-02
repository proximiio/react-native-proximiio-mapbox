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

Current public version is: `5.0.3`

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
    await Proximiio.requestPermissions()

    Proximiio.subscribe(ProximiioEvents.PositionUpdated, (location: ProximiioLocation) => {
      this._camera?.setCamera({
        centerCoordinate: [location.lng, location.lat],
        animationDuration: 2000,
      })
    });

    await this.setState({
      proximiioReady: true
    })
  }

  render() {
    if (!this.state.proximiioReady ) {
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    }

    return (<React.Fragment>
      <MapboxGL.MapView
        ref={map => (this._map = map)}
        style={{ flex: 1 }}
        styleURL={ProximiioMapbox.styleURL}
        onDidFinishLoadingMap={() => this.setState({ mapLoaded: true })}>
        <MapboxGL.Camera
          ref={camera => {this._camera = camera}}
          zoomLevel={18}
          minZoomLevel={1}
          maxZoomLevel={24}
          animationMode={'flyTo'}
          animationDuration={250}
          centerCoordinate={this.state.coordinates}
        />
        { this.state.mapLoaded && <ProximiioContextProvider>
          <AmenitySource />
          <GeoJSONSource level={this.state.mapLevel} />
          <RoutingSource level={this.state.mapLevel} />
          <UserLocationSource level={this.state.mapLevel} />
        </ProximiioContextProvider> }
      </MapboxGL.MapView>
      <View style={styles.buttons}>
        <Button title="UP" onPress={() => this.setState({ mapLevel: this.state.mapLevel + 1 }) }/>
        <Button title="DOWN" onPress={() => this.setState({ mapLevel: this.state.mapLevel -1 }) }/>
        <Button title="CANCEL ROUTE" onPress={() => {
          ProximiioMapbox.routeCancel()
        } }/>
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
  selection?: string[] // filters selected POI ids, undefined = no filtering, empty array = no pois shown
  onPress?: (features: Feature[]) => void; // tap action trigger for geojson data, see note
}
```
note: onPress action features attribute contains all features at the coordinates where the tap action occured, those should be 
further filtered based on your usecase, eg. const points = features.filter((f) => f.isPoint);


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
  markerStyle?: StyleProp<SymbolLayerStyle>
  accuracyStyle?: StyleProp<FillLayerStyle>
}
```

### RasterSource
provides Proximi.io raster floormaps

```ts
RasterSourceProps {
  level: number // filters features for level that is shown on map
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
The methods also provide preview option, if set to true, the route will be displayed for preview but actual routing will not start.

### ProximiioMapbox.route.find
Use this method to route to specific POI, when its id is known (eg. user taps one of the POIs)

```ts
ProximiioMapbox.route.find(poi_id: string, previewRoute: boolean): void
```

### ProximiioMapbox.route.findTo
Use this method to route to custom coordinate specified by latitude, longitude and level

```ts
ProximiioMapbox.route.findTo(
  latitude: number,
  longitude: number,
  level: number,
  preview: boolean,
): void
```

### ProximiioMapbox.route.findFrom
Provides route between two custom coordinates, both specified by latitude, longitude and level

```ts
ProximiioMapbox.route.findFrom(
  latitudeFrom: number,
  longitudeFrom: number,
  levelFrom: number,
  latitudeTo: number,
  longitudeTo: number,
  levelTo: number,
  preview: boolean,
): void
```

### ProximiioMapbox.route.findBetween
Provides route between two geojson features, both specified by id

```ts
ProximiioMapbox.route.findBetween(
  idFrom: number,
  idTo: number,
  preview: boolean,
): void
```

### ProximiioMapbox.route.cancel
Cancels the current route and removes the routing visuals

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

### ProximiioMapbox.ttsEnable(): void
Enable TTS

### ProximiioMapbox.ttsDisable(): void
Disable TTS

### ttsHeadingCorrectionEnabled(enabled: boolean): void
Enable heading correction warnings. This will enable two spoken warnings - tell user starting orientation of route, and when the user is walking the wrong way.

### ttsReassuranceInstructionEnabled(enabled: boolean): void
Enable reassurance instructions (meaning TTS will speak even if there is not a direction change to keep user confidence about current direction) using ttsReassuranceInstructionEnabled(boolean enabled) and configure distance between reassurance updates with ttsReassuranceInstructionDistance(double distanceInMeters)

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
