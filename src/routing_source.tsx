import React from 'react'
import MapboxGL, { Expression, LineLayerStyle } from '@react-native-mapbox-gl/maps'
import ProximiioMapbox, { ProximiioMapboxEvents  } from './instance'
import { ProximiioMapboxRouteUpdateEvent, FeatureCollection } from './types'
import { ProximiioRoute } from './route'
import { ProximiioRouteEvents } from './route_manager'
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
  ["!=", ["has", "completed"]],
  ["==", ["to-number", ["get", "level"]], level]
] as Expression

export type RouteState = 'started' | 'canceled' | 'off'

interface State {
  route: ProximiioRoute
  collection: FeatureCollection,
  completedFilter: Expression,
  remainingFilter: Expression,
  completedIndex: number,
  remainingIndex: number,
  routeState: RouteState,
  syncKey: string
}

export class RoutingSource extends React.Component<Props, State> {
  state = {
    route: new ProximiioRoute([]),
    collection: { type: 'FeatureCollection', features: [] } as FeatureCollection,
    completedFilter: completedFilterWithLevel(0),
    remainingFilter: remainingFilterWithLevel(0),
    completedIndex: 100,
    remainingIndex: 101,
    syncKey: `routing-source-${new Date().getTime()}`
  } as State

  componentDidMount() {
    ProximiioMapbox.route.on(this.onRouteEvent);
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.READY, this.onReady)
    ProximiioMapbox.route.off(this.onRouteEvent);
  }

  private onRouteEvent = (event?: string) => {
    if (event === ProximiioRouteEvents.ROUTE_STARTED) {
      this.onRouteStarted()
    }

    if (event === ProximiioRouteEvents.ROUTE_UPDATED) {
      this.onRouteUpdated()
    }

    if (event === ProximiioRouteEvents.ROUTE_CANCELED) {
      this.onRouteCanceled()
    }
  }

  private setRouteState = async (routeState: RouteState) => {
    await this.update();
    await this.setState({ routeState })
  }

  onReady = async () => {
    if (ProximiioMapbox.style) {
      this.setRouteState('off')
    }
  }

  onRouteStarted = async () => {
    if (ProximiioMapbox.route.route) {
      this.setRouteState('started')
    }
  }

  onRouteUpdated = () => {
    if (this.state.routeState === 'started') {
      this.update()
    }
  }

  onRouteCanceled = async () => { 
    await this.setRouteState('off')
    await this.setState({
      collection: {
        type: 'FeatureCollection',
        features: []
      }
    })
  }

  update = async () => {
    const features = ProximiioMapbox.route.isStarted && ProximiioMapbox.route.route ? ProximiioMapbox.route.route.features : [];
    await this.setState({ 
      collection: {
        type: 'FeatureCollection',
        features
      },
      completedFilter: completedFilterWithLevel(this.props.level),
      remainingFilter: remainingFilterWithLevel(this.props.level),
      syncKey: `routing-source-${new Date().getTime()}`
    })
  }

  public render() {
    return  <MapboxGL.ShapeSource
      id="routes"
      key={this.state.syncKey}
      shape={this.state.collection}
      maxZoomLevel={24}>

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_REMAINING}
        key={Constants.LAYER_ROUTING_LINE_REMAINING}
        style={remainingStyle}
        layerIndex={this.state.remainingIndex}
        aboveLayerID={'proximiio-texts'}
      />

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_COMPLETED}
        key={Constants.LAYER_ROUTING_LINE_COMPLETED}
        style={completedStyle}
        belowLayerID={Constants.LAYER_ROUTING_LINE_REMAINING}
      />
    </MapboxGL.ShapeSource>
  }
}
