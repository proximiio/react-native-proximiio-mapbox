import React from 'react'
import MapboxGL, { Expression, LineLayerStyle, SymbolLayerStyle } from '@react-native-mapbox-gl/maps'
import equal from 'fast-deep-equal/react'
import ProximiioMapbox, { ProximiioMapboxEvents  } from './instance'
import { FeatureCollection, ProximiioFeatureType } from './types'
import { ProximiioRouteEvents } from './route_managerv2'
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

export type RouteState = 'preview' | 'started' | 'canceled' | 'off';

interface Props {
  aboveLayerID?: string
  level: number
  showSymbols?: boolean
  startImage?: string
  targetImage?: string
  directionImage?: string
  symbolLayerStyle?: SymbolLayerStyle
  lineSymbolLayerStyle?: SymbolLayerStyle
  completedStyle?: LineLayerStyle
  remainingStyle?: LineLayerStyle
}

interface State {
  // route: ProximiioRoute
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
  completedStyle: LineLayerStyle
  remainingStyle: LineLayerStyle
}

export class RoutingSource extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      // route: new ProximiioRoute([]),
      collection: { type: 'FeatureCollection', features: [] } as FeatureCollection,
      completedFilter: completedFilterWithLevel(props.level),
      remainingFilter: remainingFilterWithLevel(props.level),
      symbolFilter: symbolFilterWithLevel(props.level),
      lineSymbolFilter: lineSymbolFilterWithLevel(props.level),
      completedIndex: 100,
      remainingIndex: 201,
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
      },
      remainingStyle: props.remainingStyle || remainingStyle,
      completedStyle: props.completedStyle || completedStyle
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

  private onRouteEvent = (event: string) => {


    if (event === ProximiioRouteEvents.ROUTE_ENDED) {
      this.onRouteCanceled();
    } else if (event == ProximiioRouteEvents.ROUTE_CALCULATED) {
      // TODO handle this event properly??
      this.onRoutePreview();
    } else if (event === ProximiioRouteEvents.ROUTE_PREVIEWED) {
      this.onRoutePreview();
    } else if (event === ProximiioRouteEvents.ROUTE_UPDATED) {
      this.onRouteUpdated();
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

  onRoutePreview = async () => {
    if (ProximiioMapbox.route.route) {
      this.setRouteState('preview')
    }
  }

  onRouteStarted = async () => {
    if (ProximiioMapbox.route.route) {
      this.setRouteState('started')
    }
  }

  onRouteUpdated = () => {
    if (ProximiioMapbox.route.routeStarted) {
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
    const previewedOrStarted = ProximiioMapbox.route.routePreviewed || ProximiioMapbox.route.routeStarted;
    const features = (previewedOrStarted && route) ? route.features : [];

    if (this.props.showSymbols && features.length > 0) {
      const startIdx = features.findIndex(f => f.id === 'route-start');
      const targetIdx = features.findIndex(f => f.id === 'route-target');
      const feats = startIdx >= 0 ? features.filter(f => typeof f.id === 'undefined') : features;
      const startCoords = features[0].geometry.coordinates[0];
      const start = Feature.point('route-start', startCoords[1], startCoords[0], {
        image: this.state.startImage,
        level: features[0].properties.level
      }) as ProximiioFeatureType;

      const lastFeature = feats[feats.length - 1];
      const targetCoords = lastFeature.geometry.coordinates[lastFeature.geometry.coordinates.length - 1];

      const target = Feature.point('route-target', targetCoords[1], targetCoords[0], {
        image: this.state.targetImage,
        level: lastFeature.properties.level
      }) as ProximiioFeatureType;

      if (startIdx === -1) {
        features.push(start);
      } else {
        features.splice(startIdx, 1, start);
      }

      if (targetIdx === -1) {
        features.push(target);
      } else {
        features.splice(targetIdx, 1, target);
      }
    }

    this.setState({
      collection: {
        type: 'FeatureCollection',
        features
      },
      completedFilter: completedFilterWithLevel(this.props.level),
      remainingFilter: remainingFilterWithLevel(this.props.level),
      symbolFilter: symbolFilterWithLevel(this.props.level),
      lineSymbolFilter: lineSymbolFilterWithLevel(this.props.level),
      syncKey: `routing-source-${new Date().getTime()}`
    }, () => {
      // rn mapbox drawing order issue workaround
      setTimeout(() => {
        this.setState({ syncKey: `routing-source-${new Date().getTime()}` })
      }, 1000)
    })
  }

  public render() {
    const aboveLayerID = this.props.aboveLayerID || Constants.LAYER_POLYGONS_ABOVE_PATHS
    const syncKey = new Date().getTime();

    return <MapboxGL.ShapeSource
      id="routes"
      key={this.state.syncKey}
      shape={this.state.collection}
      maxZoomLevel={24}>

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_REMAINING}
        key={`${Constants.LAYER_ROUTING_LINE_REMAINING}:${syncKey}`}
        style={this.state.remainingStyle}
        filter={this.state.remainingFilter}
        aboveLayerID={aboveLayerID}
      />

      <MapboxGL.LineLayer
        id={Constants.LAYER_ROUTING_LINE_COMPLETED}
        key={`${Constants.LAYER_ROUTING_LINE_COMPLETED}${syncKey}`}
        style={this.state.completedStyle}
        filter={this.state.completedFilter}
        belowLayerID={Constants.LAYER_ROUTING_LINE_REMAINING}
      />

      <MapboxGL.SymbolLayer
        id={Constants.LAYER_ROUTING_DIRECTION}
        key={`${Constants.LAYER_ROUTING_DIRECTION}${syncKey}`}
        style={this.state.lineSymbolLayerStyle}
        filter={this.state.lineSymbolFilter}
        aboveLayerID={Constants.LAYER_ROUTING_LINE_REMAINING}
      />

      <MapboxGL.SymbolLayer
        id={Constants.LAYER_ROUTING_SYMBOLS}
        key={`${Constants.LAYER_ROUTING_SYMBOLS}${syncKey}`}
        style={this.state.symbolLayerStyle}
        filter={this.state.symbolFilter}
        aboveLayerID={Constants.LAYER_ROUTING_DIRECTION}
      />

    </MapboxGL.ShapeSource>
  }
}
