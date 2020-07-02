import React from 'react'
import MapboxGL, { Expression, LineLayerStyle, SymbolLayerStyle } from '@react-native-mapbox-gl/maps'
import equal from 'fast-deep-equal/react'
import ProximiioMapbox, { ProximiioMapboxEvents  } from './instance'
import { FeatureCollection, FeatureType } from './types'
import { ProximiioRoute } from './route'
import { ProximiioRouteEvents } from './route_manager'
import Constants from './constants'
import { Feature } from './feature'

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
  ["has", "completed"],
  ["==", ["to-number", ["get", "level"]], level]
] as Expression

const remainingFilterWithLevel = (level: number) => [
  "all",
  ["==", ["geometry-type"], "LineString"],
  ["==", ["to-number", ["get", "level"]], level]
] as Expression

const symbolFilterWithLevel = (level: number) => [
  "all",
  ["==", ["geometry-type"], "Point"],
  ["==", ["to-number", ["get", "level"]], level]
] as Expression

const lineSymbolFilterWithLevel = (level: number) => [
  "all",
  ["==", ["geometry-type"], "LineString"],
  ["==", ["to-number", ["get", "level"]], level]
] as Expression

export type RouteState = 'started' | 'canceled' | 'off'


interface Props {
  level: number
  showSymbols?: boolean
  startImage?: string
  targetImage?: string
  directionImage?: string
  symbolLayerStyle?: SymbolLayerStyle
  lineSymbolLayerStyle?: SymbolLayerStyle
}

interface State {
  route: ProximiioRoute
  collection: FeatureCollection
  completedFilter: Expression
  remainingFilter: Expression
  symbolFilter: Expression
  lineSymbolFilter: Expression
  completedIndex: number
  remainingIndex: number
  routeState: RouteState
  syncKey: string
  startImage: string
  targetImage: string
  directionImage: string
  symbolLayerStyle: SymbolLayerStyle
  lineSymbolLayerStyle: SymbolLayerStyle
}

export class RoutingSource extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      route: new ProximiioRoute([]),
      collection: { type: 'FeatureCollection', features: [] } as FeatureCollection,
      completedFilter: completedFilterWithLevel(0),
      remainingFilter: remainingFilterWithLevel(0),
      symbolFilter: symbolFilterWithLevel(0),
      lineSymbolFilter: lineSymbolFilterWithLevel(0),
      completedIndex: 100,
      remainingIndex: 101,
      routeState: 'off',
      syncKey: `routing-source-${new Date().getTime()}`,
      startImage: props.startImage || 'routeStart',
      targetImage:  props.targetImage ||'routeTarget',
      directionImage: props.directionImage || 'routeDirection',
      symbolLayerStyle: props.symbolLayerStyle || {
        iconImage: ['get', 'image'],
        iconAllowOverlap: true,
        iconOffset: [0.5, 0.5],
      },
      lineSymbolLayerStyle: props.lineSymbolLayerStyle || {
        iconImage: this.props.directionImage || 'routeDirection',
        iconAllowOverlap: true,
        symbolSpacing: 100,
        symbolPlacement: 'line',
      }
    }
  }

  componentDidMount() {
    ProximiioMapbox.route.on(this.onRouteEvent);
  }

  componentDidUpdate(prevProps: Props) {
    if (!equal(this.props, prevProps)) {
      this.setState({
        startImage: this.props.startImage || 'routeStart',
        targetImage:  this.props.targetImage ||'routeTarget',
        directionImage:  this.props.directionImage ||'routeDirection',
        symbolLayerStyle: this.props.symbolLayerStyle || {
          iconImage: ['get', 'image'],
          iconAllowOverlap: true,
          iconOffset: [0.5, 0.5],
        },
        lineSymbolLayerStyle: this.props.lineSymbolLayerStyle || {
          iconImage: this.props.directionImage || 'routeDirection',
          iconAllowOverlap: true,
          symbolPlacement: 'line',
        }
      }, () => {
        this.update()
      })
    }
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.READY, this.onReady);
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
    const route = ProximiioMapbox.route.route;
    const features = (ProximiioMapbox.route.isStarted && route) ? route.features : [];
    
    if (this.props.showSymbols && features.length > 0) {
      const startCoords = features[0].geometry.coordinates[0];
      const start = Feature.point('route-start', startCoords[1], startCoords[0], {
        image: this.state.startImage,
        level: features[0].properties.level
      }) as FeatureType;
      const lastFeature = features[features.length - 1]
      const targetCoords = lastFeature.geometry.coordinates[lastFeature.geometry.coordinates.length - 1];
      const target = Feature.point('route-target', targetCoords[1], targetCoords[0], {
        image: this.state.targetImage,
        level: lastFeature.properties.level
      }) as FeatureType;
      features.push(start);
      features.push(target);
    }

    await this.setState({ 
      collection: {
        type: 'FeatureCollection',
        features
      },
      completedFilter: completedFilterWithLevel(this.props.level),
      remainingFilter: remainingFilterWithLevel(this.props.level),
      symbolFilter: symbolFilterWithLevel(this.props.level),
      lineSymbolFilter: lineSymbolFilterWithLevel(this.props.level),
      syncKey: `routing-source-${new Date().getTime()}`
    })
  }

  public render() {
    return <MapboxGL.ShapeSource
      id="routes"
      key={this.state.syncKey}
      shape={this.state.collection}
      maxZoomLevel={24}>

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_REMAINING}
        key={Constants.LAYER_ROUTING_LINE_REMAINING}
        style={remainingStyle}
        layerIndex={this.state.remainingIndex}
        filter={this.state.remainingFilter}
        aboveLayerID={'proximiio-texts'}
      />

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_COMPLETED}
        key={Constants.LAYER_ROUTING_LINE_COMPLETED}
        style={completedStyle}
        filter={this.state.completedFilter}
        belowLayerID={Constants.LAYER_ROUTING_LINE_REMAINING}
      />


      <MapboxGL.SymbolLayer
        id={Constants.LAYER_ROUTING_DIRECTION}
        key={Constants.LAYER_ROUTING_DIRECTION}
        style={this.state.lineSymbolLayerStyle}
        filter={this.state.lineSymbolFilter}
        aboveLayerID={Constants.LAYER_ROUTING_LINE_REMAINING}
      />

      <MapboxGL.SymbolLayer
        id={Constants.LAYER_ROUTING_SYMBOLS}
        key={Constants.LAYER_ROUTING_SYMBOLS}
        style={this.state.symbolLayerStyle}
        filter={this.state.symbolFilter}
        aboveLayerID={Constants.LAYER_ROUTING_DIRECTION}
      />

    </MapboxGL.ShapeSource>
  }
}
