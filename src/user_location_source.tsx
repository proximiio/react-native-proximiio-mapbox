import React, { Context } from 'react';
import { StyleProp } from 'react-native';
import MapboxGL, {
  Expression,
  FillLayerStyle,
  SymbolLayerStyle,
} from '@react-native-mapbox-gl/maps';
import { ProximiioLocation, ProximiioContext, ProximiioContextType } from 'react-native-proximiio';
import ProximiioMapbox, { ProximiioMapboxEvents } from './instance';

import Constants from './constants';
import { isIOS, createGeoJSONCircle } from './helpers';
import { FeatureType, FeatureCollection } from './types';

export type UserLocationSourceOptions = {
  aboveLayer?: string
  markerStyle?: StyleProp<SymbolLayerStyle>
  accuracyStyle?: StyleProp<FillLayerStyle>
};

interface Props {
  level: number
  options?: UserLocationSourceOptions
}

const accuracyFilterFor = (level: number) => (isIOS ?
  [
    'all',
    ['==', 'usecase', 'user-location-accuracy'],
    ['==', 'level', level],
  ] :
  [
    'all',
    ['==', ['get', 'usecase'], 'user-location-accuracy'],
    ['==', ['to-number', ['get', 'level']], level],
  ]
) as Expression;

const markerFilterFor = (level: number) => (isIOS ?
  [
    'all',
    ['==', 'usecase', 'user-location'],
    ['==', 'level', level]
  ] :
  [
    'all',
    ['==', ['get', 'usecase'], 'user-location'],
    ['==', ['to-number', ['get', 'level']], level],
  ]
) as Expression;

const defaultOptions = {
  aboveLayer: Constants.LAYER_POLYGONS_ABOVE_PATHS,
  markerStyle: {
    iconImage: ['get', 'icon'] as Expression,
    iconSize: 0.5,
    iconAllowOverlap: true
  },
  accuracyStyle: {
    fillColor: '#0080c0',
    fillOpacity: 0.3,
  },
};

const getCollection = (location: ProximiioLocation, level: number): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          createGeoJSONCircle(
            [location.lng, location.lat],
            (location.accuracy || 50) / 1000,
            50
          ),
        ],
      },
      properties: {
        usecase: 'user-location-accuracy',
        level,
      },
    } as FeatureType,
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      properties: {
        usecase: 'user-location',
        icon: 'bluedot',
        level,
      },
    } as FeatureType
  ],
})

interface State {
  accuracyIndex: number
  markerIndex: number
  accuracyFilter: any
  markerFilter: any
  location?: ProximiioLocation
  collection: {
    type: 'FeatureCollection',
    features: FeatureType[]
  }
}

export class UserLocationSource extends React.Component<Props, State> {
  static contextType: Context<ProximiioContextType> = ProximiioContext

  state = {
    accuracyFilter: accuracyFilterFor(this.context.level),
    markerFilter: markerFilterFor(this.context.level),
    accuracyIndex: 200,
    markerIndex: 201,
    collection: {
      type: 'FeatureCollection',
      features: []
    }
  } as State

  componentDidMount() {
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange)
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange)
  }

  componentDidUpdate(prevProps: Props) {
    const newState = {} as State

    if (this.context.location) {
      newState.location = this.context.location
    }

    if (prevProps.level !== this.props.level) {
      newState.accuracyFilter = accuracyFilterFor(this.context.level)
      newState.markerFilter = markerFilterFor(this.context.level)
    }

    this.setState(newState)
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    if (this.props.level !== nextProps.level) {
      return true
    }

    if (this.context.location && !nextState.location) {
      return true
    }

    if (this.context.location && nextState.location) {
      if ((this.context.location.lng !== nextState.location.lng) ||
          (this.context.location.lat !== nextState.location.lat)) {
        return true
      }
    }

    return false
  }

  onChange = () => {
    if (!this.context.location) {
      return
    }

    const idx = ProximiioMapbox.style.layers.length
    this.setState({
      accuracyIndex: idx + 2,
      markerIndex: idx + 3,
      collection: getCollection(this.context.location, this.context.level) 
    })
  }

  public render() {
    const _options = {
      ...defaultOptions
    };

    if (!this.context.location) {
      return null
    }

    const collection = getCollection(this.context.location, this.context.level);

    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_USER_LOCATION}
        key={Constants.SOURCE_USER_LOCATION}
        shape={collection}
        cluster={false}
        maxZoomLevel={24}
      >
        <MapboxGL.FillLayer
          id={Constants.LAYER_USER_ACCURACY}
          key={Constants.LAYER_USER_ACCURACY}
          filter={this.state.accuracyFilter}
          style={_options.accuracyStyle}
          layerIndex={this.state.accuracyIndex}
        />
  
        <MapboxGL.SymbolLayer
          id={Constants.LAYER_USER_MARKER + '2'}
          key={Constants.LAYER_USER_MARKER}
          filter={this.state.markerFilter}
          style={_options.markerStyle}
          aboveLayerID={Constants.LAYER_USER_ACCURACY}
        />
      </MapboxGL.ShapeSource>
    )
  }
}
