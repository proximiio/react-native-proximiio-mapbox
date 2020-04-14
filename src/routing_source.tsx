import React from 'react'
import MapboxGL, { Expression, LineLayerStyle } from '@react-native-mapbox-gl/maps'
import ProximiioMapbox, { ProximiioMapboxEvents  } from './index'
import produce from 'immer'
import { ProximiioMapboxRouteUpdateEvent, ProximiioMapboxRouteAndroid, ProximiioMapboxRouteIOS, FeatureCollection } from './types'
import { isIOS } from './helpers'
import { ProximiioRoute } from './route'
import Constants from './constants'

interface Props {
  level: number
}

const completedStyle = {
  lineCap: 'round',
  lineJoin: 'round',
  lineOpacity: 0.15,
  lineColor: '#39c6e1',
  lineWidth: 10
} as LineLayerStyle

const remainingStyle = {
  lineCap: 'round',
  lineJoin: 'round',
  lineOpacity: 0.9,
  lineColor: '#39c6e1',
  lineWidth: 10
} as LineLayerStyle

const completedFilterWithLevel = (level: number) => [
  "all",
  ["==", ["geometry-type"], "LineString"],
  ["==", ["has", "completed"]],
  ["==", ["to-number", ["get", "level"]], level]
] as Expression

const remainingFilterWithLevel = (level: number) => [
  "all",
  ["==", ["geometry-type"], "LineString"],
  ["!", ["has", "completed"]],
  ["==", ["to-number", ["get", "level"]], level]
] as Expression

interface State {
  route: ProximiioRoute
  collection: FeatureCollection,
  completedFilter: Expression,
  remainingFilter: Expression,
  completedIndex: number,
  remainingIndex: number,
  routeState: 'started' | 'canceled' | 'off'
}

export class RoutingSource extends React.Component<Props, State> {
  state = {
    route: new ProximiioRoute([]),
    collection: { type: 'FeatureCollection', features: [] } as FeatureCollection,
    completedFilter: completedFilterWithLevel(0),
    remainingFilter: remainingFilterWithLevel(0),
    completedIndex: 100,
    remainingIndex: 101
  } as State

  componentDidMount() {
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.READY, this.onReady)
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.ROUTE_STARTED, this.onRouteStarted)
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.ROUTE_UPDATED, this.onRouteUpdated)
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.ROUTE_CANCELED, this.onRouteCanceled)
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.READY, this.onReady)
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.ROUTE_STARTED, this.onRouteStarted)
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.ROUTE_UPDATED, this.onRouteUpdated)
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.ROUTE_CANCELED, this.onRouteCanceled)
  }

  onReady = async () => {
    if (ProximiioMapbox.style) {
      const route = new ProximiioRoute([])
      await this.update(route)
      await this.setState({ routeState: 'off' })
    }
  }

  onRouteStarted = async (_route: ProximiioMapboxRouteIOS | ProximiioMapboxRouteAndroid) => {
    const route = isIOS ?
      ProximiioRoute.fromIOS(_route as ProximiioMapboxRouteIOS) :
      ProximiioRoute.fromAndroid(_route as ProximiioMapboxRouteAndroid)
    await this.update(route)
    await this.setState({ routeState: 'started' })
  }

  onRouteUpdated = (event: ProximiioMapboxRouteUpdateEvent) => {
    if (this.state.routeState === 'started') {
      const route = produce(this.state.route, (newRoute: ProximiioRoute) => {
        newRoute.update(event.data)
      })
      this.update(route)
    }
  }

  onRouteCanceled = async () => {
    const route = new ProximiioRoute([])
    await this.update(route)
    await this.setState({ routeState: 'off' })
  }

  update = async (route: ProximiioRoute) => {
    const idx = ProximiioMapbox.style.layers.length
    await this.setState({ 
      route, 
      collection: {
        type: 'FeatureCollection',
        features: route.features
      },
      completedFilter: completedFilterWithLevel(this.props.level),
      remainingFilter: remainingFilterWithLevel(this.props.level),
      completedIndex: idx,
      remainingIndex: idx + 1
    })
  }

  public render() {
    return  <MapboxGL.ShapeSource
      id="routes"
      key={`routing-source`}
      shape={this.state.collection}
      maxZoomLevel={24}>

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_REMAINING}
        key={Constants.LAYER_ROUTING_LINE_REMAINING}
        filter={this.state.remainingFilter}
        style={remainingStyle}
        layerIndex={this.state.remainingIndex}
        aboveLayerID={Constants.LAYER_USER_MARKER}
      />

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_COMPLETED}
        key={Constants.LAYER_ROUTING_LINE_COMPLETED}
        filter={this.state.completedFilter}
        style={completedStyle}
        layerIndex={this.state.completedIndex}
      />
    </MapboxGL.ShapeSource>
  }
}
