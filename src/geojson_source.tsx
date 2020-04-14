import React from 'react';
import MapboxGL from '@react-native-mapbox-gl/maps';;
import LayerMapper from './layer_mapper';
import ProximiioMapbox, { ProximiioMapboxEvents } from './instance';
import { Feature } from './types'
import equal from 'fast-deep-equal/react';

interface Props {
  level: number
  selection?: string[]
}

type VariousLayer = MapboxGL.BackgroundLayer | MapboxGL.LineLayer | MapboxGL.FillLayer | MapboxGL.SymbolLayer | MapboxGL.CircleLayer | MapboxGL.HeatmapLayer | MapboxGL.FillExtrusionLayer

interface State {
  collection: {
    type: 'FeatureCollection',
    features: Feature[]
  },
  layers: VariousLayer[]
}

export class GeoJSONSource extends React.Component<Props, State> {
  state = {
    collection: { 
      type: 'FeatureCollection', 
      features: [] 
    },
    layers: []
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
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return !equal(nextState, this.state) || nextProps.level !== this.props.level
  }

  async tryFeatures() {
    const features = await ProximiioMapbox.getFeatures()
    await this.setState({
      collection: {
        type: 'FeatureCollection',
        features
      }
    })
  }

  getLayers = () => LayerMapper(ProximiioMapbox.style, 'main', this.props.level) as VariousLayer[]

  tryLayers = () => this.setState({
    layers: this.getLayers()
  })

  updateLevel = () => this.setState({
    layers: this.getLayers()
  })

  onChange = async (features: Feature[]) => {
    await this.setState({
      collection: {
        type: 'FeatureCollection',
        features
      }
    })
  }

  public render() {
    return <MapboxGL.ShapeSource
      id="main"
      shape={this.state.collection}
      maxZoomLevel={24}>
      { this.state.layers }
    </MapboxGL.ShapeSource>
  }
}

export default GeoJSONSource
