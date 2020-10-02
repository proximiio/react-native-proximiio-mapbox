import React from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';;
import LayerMapper from './layer_mapper';
import ProximiioMapbox, { ProximiioMapboxEvents } from './instance';
import { Feature } from './feature';
import { FeatureType } from './types';
import equal from 'fast-deep-equal/react';

interface Props {
  level: number
  selection?: string[]
  filter?: (Feature: Feature) => boolean
  onPress?: (features: Feature[]) => void
}

type VariousLayer = MapboxGL.BackgroundLayer | MapboxGL.LineLayer | MapboxGL.FillLayer | MapboxGL.SymbolLayer | MapboxGL.CircleLayer | MapboxGL.HeatmapLayer | MapboxGL.FillExtrusionLayer

interface State {
  collection: {
    type: 'FeatureCollection',
    features: Feature[]
  },
  layers: VariousLayer[],
  syncKey: number
}

export class GeoJSONSource extends React.Component<Props, State> {
  state = {
    collection: { 
      type: 'FeatureCollection', 
      features: [] 
    },
    layers: [],
    syncKey: 0
  } as State

  componentDidMount() {
    this.tryFeatures()
    this.tryLayers()
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange)
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange)
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.level !== this.props.level) {
      this.updateLevel()
    } else {
      if (!equal(prevProps, this.props)) {
        this.tryFeatures()
      }
    }
  }

  async tryFeatures() {
    const s = new Date();
    const _features = await ProximiioMapbox.getFeatures();
    const features = this.props.filter ? _features.filter(this.props.filter) : _features;
    this.setState({
      collection: {
        type: 'FeatureCollection',
        features,
      },
      syncKey: new Date().getTime()
    })
  }

  getLayers = () => { 
    const layers = LayerMapper(ProximiioMapbox.style, 'main', this.props.level) as VariousLayer[];
    return layers;
  }

  tryLayers = () => { 
    this.setState({ layers: this.getLayers() })
  }

  updateLevel = () => { 
    this.setState({ layers: this.getLayers() })
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
          this.props.onPress(evt.features.map((f: FeatureType) => new Feature(f)))
        }
      }}>
      { this.state.layers }
    </MapboxGL.ShapeSource>
  }
}

export default GeoJSONSource
