import React from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';
import LayerMapper from './layer_mapper';
import ProximiioMapbox, { ProximiioMapboxEvents } from './instance';
import { Feature } from './feature';
import { ProximiioFeatureType } from './types';
import equal from 'fast-deep-equal/react';
import rewind from '@mapbox/geojson-rewind';

interface Props {
  level: number
  filter?: (Feature: Feature) => boolean
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

export class GeoJSONSource extends React.Component<Props, State> {
  state = {
    collection: {
      type: 'FeatureCollection',
      features: []
    },
    syncKey: 0
  } as State

  componentDidMount() {
    this.tryFeatures()
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange)
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange)
  }

  shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, _: any): boolean {
    return (
      this.props.level !== nextProps.level
      || this.props.filter !== nextProps.filter
      || this.state.syncKey !== nextState.syncKey
    );
  }

  async tryFeatures() {
    const s = new Date();
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
    return layers;
  }

  onChange = () => {
    this.tryFeatures()
  }

  public render() {
    return <MapboxGL.ShapeSource
      id="main"
      key={`geojson-source-${this.state.syncKey}`}
      shape={this.state.collection as any}
      maxZoomLevel={24}
      onPress={(evt: any) => {
        if (this.props.onPress) {
          // Mapbox can modify features internally, ensure user gets Proximi.io features
          const featureIds = evt.features.map((it) => it.id);
          const pressedFeatures = this.state.collection.features.filter((it) => featureIds.includes(it.id));
          this.props.onPress(pressedFeatures);
        }
      }}>
      { this.getLayers() }
    </MapboxGL.ShapeSource>
  }
}

export default GeoJSONSource
