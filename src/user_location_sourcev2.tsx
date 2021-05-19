import React from 'react';
import { StyleProp} from 'react-native';
import MapboxGL, {
  Expression,
  FillLayerStyle,
  SymbolLayerStyle,
} from '@react-native-mapbox-gl/maps';
import Proximiio, { ProximiioLocation } from 'react-native-proximiio';
import ProximiioMapbox, { ProximiioMapboxEvents } from './instance';

import Constants from './constants';
import { isIOS, createGeoJSONCircle } from './helpers';
import { ProximiioFeatureType, FeatureCollection } from './types';

export type UserLocationSourceOptions = {
  aboveLayer?: string
  markerStyle?: StyleProp<SymbolLayerStyle>
  accuracyStyle?: StyleProp<FillLayerStyle>
};

interface Props {
  options?: UserLocationSourceOptions
}

const accuracyFilterFor = () => (isIOS ?
    [
      'all',
      ['==', 'usecase', 'user-location-accuracy'],
    ] :
    [
      'all',
      ['==', ['get', 'usecase'], 'user-location-accuracy'],
    ]
) as Expression;

const markerFilterFor = () => (isIOS ?
    [
      'all',
      ['==', 'usecase', 'user-location'],
    ] :
    [
      'all',
      ['==', ['get', 'usecase'], 'user-location'],
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

const getCollection = (location: ProximiioLocation): FeatureCollection => ({
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
      },
    } as ProximiioFeatureType,
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      properties: {
        usecase: 'user-location',
        icon: 'bluedot',
      },
    } as ProximiioFeatureType
  ],
})

interface State {
  location?: ProximiioLocation
}

export class UserLocationSource extends React.Component<Props, State> {
  state = {
    location: Proximiio.location
  } as State

  componentDidMount() {
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.STYLE_CHANGED, this.onChange);
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange);
    ProximiioMapbox.subscribe(ProximiioMapboxEvents.LOCATION_UPDATED, this.onLocationChanged);
  }

  componentWillUnmount() {
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.STYLE_CHANGED, this.onChange);
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.FEATURES_CHANGED, this.onChange);
    ProximiioMapbox.unsubscribe(ProximiioMapboxEvents.LOCATION_UPDATED, this.onLocationChanged);
  }

  private onChange = () => {
    if (!this.state.location) {
      return
    }
  }

  private onLocationChanged = (location: ProximiioLocation) => {
    this.setState({location: location});
  }

  public render() {
    const _options = {
      ...defaultOptions,
      ...this.props.options
    };

    if (!this.state.location) {
      return null
    }

    const collection = getCollection(this.state.location);

    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_USER_LOCATION}
        key={Constants.SOURCE_USER_LOCATION + new Date().getTime()}
        shape={collection}
        cluster={false}
        maxZoomLevel={24}
      >
        <MapboxGL.FillLayer
          id={Constants.LAYER_USER_ACCURACY}
          key={Constants.LAYER_USER_ACCURACY + new Date().getTime()}
          filter={accuracyFilterFor()}
          style={_options.accuracyStyle}
          layerIndex={ProximiioMapbox.style.layers.length * 2}
          // aboveLayerID={Constants.LAYER_POLYGONS_ABOVE_PATHS}
        />
        <MapboxGL.SymbolLayer
          id={Constants.LAYER_USER_MARKER}
          key={Constants.LAYER_USER_MARKER}
          filter={markerFilterFor()}
          style={_options.markerStyle}
          layerIndex={ProximiioMapbox.style.layers.length * 2}
          // aboveLayerID={Constants.LAYER_USER_ACCURACY}
        />
      </MapboxGL.ShapeSource>
    )
  }
}
