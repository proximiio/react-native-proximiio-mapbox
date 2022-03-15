import React, { PropsWithChildren } from 'react';
import MapboxGL, { OnPressEvent } from '@react-native-mapbox-gl/maps';
import LayerMapper from './layer_mapper';
import ProximiioMapbox, { ProximiioMapboxEvents } from './instance';
import { Feature } from './feature';
import { EmitterSubscription } from 'react-native';

interface Props {
  level: number
  filter?: (Feature: Feature) => boolean
  ignoreLayers?: string[] // array of layer ids to set invisible
  onPress?: (features: Feature[]) => void
}

type VariousLayer = MapboxGL.BackgroundLayer | MapboxGL.LineLayer | MapboxGL.FillLayer | MapboxGL.SymbolLayer | MapboxGL.CircleLayer | MapboxGL.HeatmapLayer | MapboxGL.FillExtrusionLayer

interface State {
  collection: {
    type: 'FeatureCollection',
    features: Feature[]
  },
  syncKey: number
}

export class GeoJSONSource extends React.Component<PropsWithChildren<Props>, State> {
  private featuresSub?: EmitterSubscription;

  state = {
    collection: {
      type: 'FeatureCollection',
      features: []
    },
    syncKey: 0
  } as State

  componentDidMount() {
    this.tryFeatures()
    this.featuresSub = ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange)
  }

  componentWillUnmount() {
    this.featuresSub?.remove();
  }

  componentDidUpdate(prevProps: Readonly<React.PropsWithChildren<Props>>): void {
    if (prevProps.filter !== this.props.filter) {
      this.tryFeatures()
    }
  }

  shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, _: any): boolean {
    return (
      this.props.level !== nextProps.level
      || this.props.filter !== nextProps.filter
      || this.state.syncKey !== nextState.syncKey
    );
  }

  async tryFeatures() {
    const _features = ProximiioMapbox.getFeatures();
    const features = this.props.filter ? _features.filter(this.props.filter) : _features;
    this.setState({
      collection: {
        type: 'FeatureCollection',
        features: features,
      },
      syncKey: new Date().getTime()
    })
  }

  getLayers = () => {
    const layers = LayerMapper(ProximiioMapbox.style, 'main', this.props.level) as VariousLayer[];

    if (Array.isArray(this.props.ignoreLayers)) {
      layers.forEach(layer => {
        if (layer.props.id && this.props.ignoreLayers!.includes(layer.props.id)) {
          const style = layer.props.style;
          (style as any).visibility = 'none'
        }
      })
    }

    return layers;
  }

  onChange = () => this.tryFeatures()

  onPress = (evt: OnPressEvent) => {
    if (!this.props.onPress) {
      return
    }

    // Mapbox can modify features internally, ensure user gets Proximi.io features
    const featureIds = evt.features.map((it: any) => it.id);
    const pressedFeatures = this.state.collection.features.filter((it) => featureIds.includes(it.id));
    this.props.onPress(pressedFeatures);
  }

  public render() {
    return <>
      <MapboxGL.ShapeSource
        id="main"
        key="geojson-source"
        shape={this.state.collection as any}
        maxZoomLevel={24}
        onPress={this.onPress}>
        { this.getLayers() }
      </MapboxGL.ShapeSource>
      {this.props.children}
    </>;
  }
}

export default GeoJSONSource
