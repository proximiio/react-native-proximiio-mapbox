import * as React from 'react';
import MapboxGL from "@react-native-mapbox-gl/maps";

import Proximiio, {
  ProximiioContextProvider, ProximiioEvents, ProximiioLocation
} from 'react-native-proximiio';

import ProximiioMapbox, { UserLocationSource, AmenitySource, GeoJSONSource, RoutingSource, ProximiioMapboxEvents } from '../../src/index';
import { Text, Button, View } from 'react-native';
import { ProximiioMapboxRouteUpdateEvent } from 'src/types';

const TOKEN = 'INSERT-PROXIMIIO-TOKEN-HERE'
MapboxGL.setAccessToken('optional-your-mapbox-token-here')

interface Props {

}

interface State {
  coordinates: number[],
  mapLoaded: boolean,
  mapLevel: number,
  proximiioReady: boolean
  message: string
}

export default class App extends React.Component<Props, State> {
  _map : MapboxGL.MapView | null = null
  _camera: MapboxGL.Camera | null = null

  state = {
    coordinates: [ 24.9217484, 60.1669635 ],
    mapLoaded: false,
    mapLevel: 0,
    proximiioReady: false,
    message: ''
  }

  componentDidMount() {
    this.initProximiio()
  }

  componentWillUnmount() {
    Proximiio.destroy(false)
  }

  async initProximiio() {
    await Proximiio.authorize(TOKEN)
    await ProximiioMapbox.authorize(TOKEN)

    await Proximiio.requestPermissions()

    Proximiio.subscribe(ProximiioEvents.PositionUpdated, (location: ProximiioLocation) => {
      if (location) {
        this._camera?.setCamera({
          centerCoordinate: [location.lng, location.lat],
          animationDuration: 2000,
        })
      }
    });

    await this.setState({
      proximiioReady: true
    })

    ProximiioMapbox.subscribe(ProximiioMapboxEvents.ROUTE_STARTED, () => this.onMessage('ROUTE STARTED'))
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.ROUTE_UPDATED, (update: ProximiioMapboxRouteUpdateEvent) => this.onMessage(`ROUTE UPDATED: ${update.type} ${JSON.stringify(update.data)}`))
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.ROUTE_CANCELED, () => this.onMessage('ROUTE CANCELED'))
  }

  onMessage = (message: string) => { 
    const d = new Date()
    const tag = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
    this.setState({ message: `[${tag}] ${message}` })
  }

  render() {
    if (!this.state.proximiioReady ) {
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    }

    return (<React.Fragment>
      <MapboxGL.MapView
        logoEnabled={false}
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
          <GeoJSONSource level={this.state.mapLevel} onPress={features => {
            console.log('features tapped', features)
          }}/>
          <RoutingSource level={this.state.mapLevel} /> 
          <UserLocationSource level={this.state.mapLevel} />
        </ProximiioContextProvider> }
      </MapboxGL.MapView>
      <View style={{ position: 'absolute', zIndex: 100, right: 20, top: 100, width: 150, height: 140, backgroundColor: 'white' }}>
        <Button title="UP" onPress={() => this.setState({ mapLevel: this.state.mapLevel + 1 }) }/>
        <Button title="DOWN" onPress={() => this.setState({ mapLevel: this.state.mapLevel -1 }) }/>
        <Button title="ROUTE" onPress={() => {
          const poi = "0c4f268f-6c2f-439f-b127-33a70df62c0e:413c6c16-378b-4f3e-8374-fddd78ab534f"
          ProximiioMapbox.route.find(poi, false);
        } }/>
        <Button title="CANCEL ROUTE" onPress={() => {
          ProximiioMapbox.route.cancel()
        } }/>
      </View>

      <View style={{ position: 'absolute', zIndex: 100, right: 20, bottom: 0, left: 20, height: 100, backgroundColor: 'white' }}>
        <Text>{ this.state.message }</Text>
      </View>
    </React.Fragment>)
  }
}
